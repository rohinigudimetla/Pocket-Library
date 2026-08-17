# Module 17: Kubernetes

---

## What the app needs right now

The Module 14 deploy step was a manual container lifecycle sequence executed over SSH. On every deployment the pipeline:

- stopped the running container
- removed it
- pulled a new image from ECR
- started a replacement container with seven environment variables passed as inline flags

If the container crashed between `docker stop` and `docker run`, the application went offline with no recovery mechanism. If the process crashed at any other time, it stayed offline until a human SSHed in and restarted it. The pipeline was the only thing that knew how to start the container correctly, and the pipeline only ran on a `git push`. Nothing watched the running container, and nothing could close the gap between a crash and a recovery without human action.

Module 17 replaces that deploy step with Kubernetes. A single-node minikube cluster runs on the existing EC2 instance. The pipeline's SSH deploy step now runs `kubectl set image` and `kubectl rollout status` instead of `docker stop` and `docker run`. For each deployment Kubernetes:

- pulls the image from ECR into minikube's internal registry
- starts the container inside a new Pod
- monitors the application's health via Spring Actuator probes
- terminates the old Pod only after the new one is confirmed healthy

A `git push` to `main` now results in a rolling update with no downtime window and no manual intervention required to recover from a container failure.

---

## What I'm not doing yet

The following are excluded from scope at this scale. They are not planned for future implementation.

- The minikube cluster is a single node running on the same EC2 instance that hosts Nginx. There is no Pod scheduling across multiple machines, no availability zone distribution, and no node failure tolerance. A hardware failure on the EC2 instance takes down the application regardless of Kubernetes.
- The Deployment is set to a single replica and scales only by manual intervention. There is no CPU or memory threshold that triggers automatic replica addition.
- An Ingress controller is not in scope. Nginx continues to terminate SSL and proxy to the Kubernetes Service NodePort. Running an Ingress controller would require an additional controller deployment, a compatible certificate manager, and ongoing configuration that adds cost and operational overhead that is not justified at this scale.
- The cluster runs on minikube rather than EKS because EKS costs approximately $73 per month for the managed control plane alone, before any node costs. minikube on the existing EC2 instance has no additional cost.

The following are planned post-deployment changes with a known implementation path.

- Secret values in etcd are protected only by the access controls on the EC2 instance. The planned change is migrating to an external secrets operator that pulls values from AWS Secrets Manager directly into Kubernetes Secrets at runtime, removing etcd as a secrets store for sensitive values.
- The EC2 public IP changes on every instance restart and requires a manual Route 53 A record update. This gap has been open since Module 13. The planned change is an Elastic IP on the instance, deferred because Elastic IPs cost $0.005 per hour while the instance is stopped.
- minikube does not start automatically when EC2 restarts. The planned change is a systemd service that starts minikube on boot, making the cluster lifecycle match EC2's lifecycle.
- No token refresh mechanism exists. This has been open since Module 9. The implementation is a `/api/auth/refresh` endpoint that accepts a valid, non-expired JWT and returns a new one with a reset expiry. It has been deferred because the application has one user and session expiry has not caused a usability problem in practice.
- The SSE endpoint passes the token as a query parameter, which exposes it in Nginx access logs. This has been open since Module 12. The documented solution is a ticket-based exchange: the client requests a short-lived single-use token from a dedicated endpoint, then presents that token on the SSE connection instead of the JWT. This is deferred because it requires a new endpoint, a new Redis key pattern, and changes to the frontend SSE connection logic, and the current exposure risk is low given that the logs are only accessible to the EC2 instance owner.

---

## The simple path

The simple path is keeping the Module 14 deploy step unchanged. Running `docker stop`, `docker rm`, `docker pull`, and `docker run` over SSH is a working deployment mechanism for a single container on a single server. It requires no Kubernetes knowledge, no YAML manifests, and no cluster to maintain on EC2. Recovery from a crash still requires a human, but for a portfolio project with no SLA and infrequent traffic, that is an acceptable operational posture.

---

## What I did instead and why

**minikube runs on EC2 as the deployment target.**

The minikube cluster runs on the existing EC2 instance using the Docker driver. The control plane and the worker node are collocated on the same machine, which is the accepted limitation of a single-node cluster. The cluster exposes the Kubernetes API server at its internal Docker network address. `kubectl` on EC2 communicates with it via a kubeconfig file that minikube wrote to `~/.kube/config` on `minikube start`. The pipeline SSHes into EC2 and runs `kubectl` commands there, which means the cluster and its configuration are both local to EC2. The GitHub Actions runner never needs direct access to the cluster's API server.

**Four YAML manifest files declare the desired state of the backend.**

`secret.yaml` holds `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `REDIS_CLUSTER_NODES` as base64-encoded values. It is applied first because the Deployment references it, and a Pod that cannot find its referenced Secret fails to start. This file is not committed to the repository. The pipeline generates the Secret at deploy time using `kubectl create secret generic --dry-run=client -o yaml | kubectl apply -f -`, which writes the current GitHub Secrets values into the cluster without ever storing them as plaintext in a file or in Git history.

`configmap.yaml` holds `REDIS_TLS_ENABLED` and `REDIS_CLUSTER_MAX_REDIRECTS`. These values are not sensitive and do not change between environments, so they live in a ConfigMap rather than a Secret. The file is committed to the repository.

`deployment.yaml` declares a single replica of the Spring Boot backend. The Pod template references both the Secret and the ConfigMap via `envFrom`, which injects every key as an environment variable into the container at startup. The Deployment includes a liveness probe and a readiness probe, both targeting `/actuator/health` on port 8080. `initialDelaySeconds` is set to 120 to account for Spring Boot's startup time on a constrained instance.

`service.yaml` declares a NodePort Service that routes traffic to any Pod with the label `app: pocketlibrary-server`. The NodePort is hardcoded to `30080` so that Nginx's `proxy_pass` directive has a stable target. The Service's address removes the dependency on any individual Pod's IP, which changes every time a Pod is replaced.

**The pipeline owns image loading into minikube explicitly.**

`imagePullPolicy: Never` is set on the Deployment's container spec. This means the kubelet never attempts to pull an image from ECR directly. The pipeline pulls the image from ECR onto EC2 and loads it into minikube's internal registry before updating the Deployment. This gives the pipeline full control over exactly which image version enters the cluster and at what point in the deploy sequence. Each image is tagged with a `k8s-<sha>` prefix when loaded into minikube, which means the image running in the cluster is always traceable to the exact commit that produced it.

**`/actuator/health` serves as the probe target for both liveness and readiness.**

Spring Boot Actuator provides an HTTP health endpoint without requiring a custom controller. The liveness probe uses this endpoint to detect a process that is running but has stopped responding. The readiness probe uses it to prevent traffic from reaching a Pod that is still starting up or that has lost its connection to RDS or ElastiCache. `management.endpoints.web.exposure.include=health` limits exposure to the health endpoint only, rather than exposing the full Actuator surface. `/actuator/health` is permitted without authentication in `SecurityConfig` because the Kubernetes probe cannot present a JWT.

**Nginx proxies to the minikube Service NodePort.**

minikube runs inside a Docker container on EC2. The cluster's internal network is a Docker bridge network, and the NodePort `30080` is bound on that internal IP, not on EC2's host network. Nginx's `proxy_pass` directive points at `http://192.168.49.2:30080` rather than `localhost:30080`. This IP is stable for as long as the minikube cluster is running but may change if the cluster is deleted and recreated, which would require a one-line Nginx config update.

**The pipeline's deploy step replaces `docker run` with `kubectl set image`.**

The deploy step authenticates to ECR, pulls the image by commit SHA, loads it into minikube's internal registry under a `k8s-<sha>` tag, and runs `kubectl set image deployment/pocketlibrary-server pocketlibrary-server=<ecr-url>:k8s-<sha>`. Kubernetes detects the image change, creates a new Pod from the updated Pod template, waits for the new Pod to pass its readiness probe, and terminates the old Pod. `kubectl rollout status deployment/pocketlibrary-server --timeout=300s` blocks the pipeline step until the rollout completes. If the new Pod fails its readiness probe within the timeout, the pipeline step exits with a non-zero code and the old Pod continues serving traffic unchanged. The pipeline path filter was extended from `server/**` to include `k8s/**`, so a change to any manifest file also triggers the pipeline.

**Kubernetes Secrets replace environment variable flags on `docker run`.**

The seven `-e` flags that the Module 14 `docker run` command passed inline over SSH no longer exist. Four of those values now live in a Kubernetes Secret. Two non-sensitive values live in a ConfigMap. The pipeline generates the Secret at deploy time from GitHub Secrets, which means sensitive values are never present in the pipeline log or in any file on the runner's filesystem.

---

## The actual tradeoff

PocketLibrary is a personal book tracker with one user, one container, and no traffic spikes. The correct deployment mechanism for this application at this scale is `docker run`. A Kubernetes control plane runs etcd, an API server, a scheduler, a controller manager, and a kubelet continuously on EC2 to manage one container that serves one person. None of that machinery is necessary for what the application does. It exists because the patterns it produces are the same patterns used at companies running thousands of containers across hundreds of nodes. Desired state is declared in version-controlled YAML. The probe-based health checks mean Kubernetes actively tests whether the application is ready rather than inferring it from the process being up. Rollouts wait for confirmation before removing the previous version. The cost is a more complex deploy step, a cluster that must be manually restarted after every EC2 reboot, and a pipeline image-loading step that can fail on disk pressure. The payoff is that container crash recovery and zero-downtime deployment now happen automatically, and every decision about how the backend runs is declared in version-controlled files that go through the same pipeline as application code.

---

## At small scale (one developer, personal project deployed to users)

A solo developer shipping a product to users does not run a Kubernetes cluster. Platforms like Railway and Fly.io accept a Docker image, manage container restarts automatically, and deploy new versions without downtime. The developer pushes code, the platform builds and runs the container, and crashes are recovered without any configuration. There are no manifest files to write and no cluster to operate.

---

## At medium scale (startup, five to ten engineers, a live product)

At this scale, teams run Kubernetes on a managed service such as EKS or GKE rather than operating the control plane themselves. The cluster has multiple worker nodes spread across at least two availability zones so that a single node failure does not take the application down. When traffic spikes, the Horizontal Pod Autoscaler adds replicas automatically based on CPU utilization without anyone having to intervene. Secrets are pulled from a dedicated secrets manager at runtime rather than generated from CI environment variables. The pipeline integrates with a tool like ArgoCD, which watches the Git repository and applies manifest changes to the cluster automatically on every merge to main.

---

## At large scale (hundreds of engineers, millions of users)

At this scale, no engineer manages the control plane. EKS with managed node groups handles cluster upgrades, node replacement, and control plane availability. Pods are distributed across availability zones using topology spread constraints so that a zone outage reduces capacity without taking the service offline. The Horizontal Pod Autoscaler scales individual services on CPU, memory, or custom application metrics. PodDisruptionBudgets prevent rolling updates and node drains from reducing the available replica count below a defined minimum.

Secrets are managed by an external secrets operator that synchronizes values from AWS Secrets Manager into Kubernetes Secrets automatically. The pipeline pushes an image to ECR and applies a manifest change. A new image that fails its readiness probe triggers an automatic rollback to the previous ReplicaSet, and the on-call engineer receives an alert before the deployment reaches production traffic. The pattern used in this module is structurally identical to what runs at this scale. The difference is order of magnitude, not architecture.

---

## TLDR

A minikube cluster on EC2 replaces the `docker run` deploy step. Container crash recovery and zero-downtime deployments now happen automatically. The application is a personal book tracker running one container managed by a full Kubernetes control plane.
