# Module 14: CI/CD

---

## What the app needs right now

Every deployment in Module 13 was a manually executed sequence of twelve steps for the backend and four steps for the frontend. A one-line code change required running `mvn package`, building and tagging a Docker image, authenticating to ECR, and pushing the image. It then required SSHing into EC2, stopping the old container, removing it, pulling the new image, and starting a new container with all seven environment variables typed by hand. The frontend required `npm run build`, an S3 sync, and a CloudFront invalidation. No step in either sequence was verified by anything except the developer's own attention. Any single omission left the application in a broken or inconsistent state with no automated detection.

Module 14 automates both sequences. Two GitHub Actions workflow files replace every manual step. A push to `main` that touches `server/**` triggers the backend pipeline. A push to `main` that touches `client/**` triggers the frontend pipeline. Neither pipeline requires a human to touch a terminal.

---

## What I'm not doing yet

- No Elastic IP on the EC2 instance. The public IP still changes on every instance restart and requires a manual Route 53 A record update. This gap was already open in Module 13 and remains open. Adding an Elastic IP is a five-minute console change. It is deferred because it costs $0.005 per hour while the instance is stopped, and the infrastructure is shut down frequently between sessions.
- No staging environment. Every push to `main` deploys directly to production. A staging environment would require a second EC2 instance, a second RDS instance, a second ElastiCache cluster, a second S3 bucket, a second CloudFront distribution, and a second Route 53 subdomain. The cost and operational overhead of maintaining two full environments is disproportionate at this scale.
- No blue-green deployment. The current deployment sequence stops the running container before starting the new one, which creates a window of unavailability of approximately ten to thirty seconds per deploy. Zero-downtime deployment requires either two EC2 instances running simultaneously behind a load balancer, or ECS with a rolling update strategy. Neither is in scope for a single-instance portfolio deployment.
- No automated semantic versioning. Docker images are tagged with `latest` and the commit SHA. Incrementing MAJOR, MINOR, and PATCH numbers requires a human judgment about the type of change that cannot be reliably automated without a conventional commit parser and a semantic-release tool.
- No token refresh mechanism. This remains open from Module 9.
- The SSE endpoint still passes the token as a query parameter. This remains open from Module 12.
- `RequestsPage.tsx` and the dead Sidebar link remain open from Module 11.
- No cancel-request capability for Readers.
- No endpoint for updating a book's `pagesRead` on the backend.

---

## The simple path

The simple path is a shell script that runs the full deployment sequence from the developer's local machine. One `./deploy.sh` command executes `mvn package`, `docker build`, `docker push`, and the SSH deploy sequence in order, with credentials read from a local `.env` file and images tagged with `latest` only. Rollback means rebuilding from the last known-good commit and redeploying. There are no workflow files to write, no GitHub Secrets to configure, no runner spin-up time, and no pipeline to debug when something goes wrong. For one developer deploying infrequently, this is the correct choice.

---

## What I did instead and why

**Two workflow files replace two manual deployment sequences.**

Both files follow the same structural pattern. Each one checks out the repository onto a fresh ephemeral runner, sets up the required toolchain, builds the artifact, authenticates to AWS, and delivers the output to its target AWS service. Every step that was previously typed by hand in a terminal now executes in a defined order with failure propagation. If any step exits with a non-zero code, the pipeline stops and the previous version remains running on production unchanged.

**Path filters scope each pipeline to the part of the codebase it owns.**

`backend.yml` declares `paths: ['server/**']` on its push trigger. `frontend.yml` declares `paths: ['client/**']`. A push that modifies only `client/AppContext.tsx` does not trigger the backend pipeline. A push that modifies only `server/SecurityConfig.java` does not trigger the frontend pipeline. Without path filters, every push to `main` would trigger both pipelines regardless of what changed, consuming runner minutes and extending the time before a change reaches production.

**GitHub Secrets hold every sensitive value.**

GitHub's encrypted secret storage holds the AWS access key pair for `pocketlibrary-deploy`, the EC2 private key, the database URL and credentials, the Redis cluster endpoint, and `VITE_API_URL`. That storage is separate from the repository's file system and commit history. A secret value committed to a repository exists permanently in the commit chain and cannot be removed by deleting it from the current branch. GitHub Secrets have no history and are never written to disk as files. The workflow files reference them via `${{ secrets.SECRET_NAME }}`, which GitHub Actions replaces with the actual value at runtime and automatically masks in all log output.

**Every Docker image is tagged with the commit SHA in addition to `latest`.**

The Module 13 interview bank identified `latest`-only tagging as a senior-level rollback risk. `latest` is a pointer that moves forward with every push. After two successive pushes, the image produced by the first push becomes untagged. It still exists in ECR but is only identifiable by its digest, which requires searching the registry manually. Tagging with `${{ github.sha }}` gives every image a permanent, immutable identifier tied to the exact commit that produced it. Rollback to any previous version is `docker pull` with the SHA tag, followed by the standard stop-remove-run sequence on EC2.

**The pipeline owns the container restart policy.**

Container restart behavior is defined in the pipeline's `docker run` step rather than left to manual convention. The `--restart unless-stopped` flag is written into `backend.yml`, which means every deployment enforces it automatically and no individual run of the pipeline can omit it. The container restarts on EC2 reboot unless a human explicitly stops it. Encoding operational behavior inside the pipeline rather than relying on the developer to type it correctly on each deployment is the architectural position this decision reflects.

**Semantic versioning is documented as a manual process only.**

Automated semantic versioning requires a conventional commit format such as `feat:`, `fix:`, and `BREAKING CHANGE:` enforced across every commit, a parser that reads those prefixes and determines the correct version increment, and a release tool that tags the Git commit and updates a changelog file. Enforcing conventional commit format across a solo project without a linter and a pre-commit hook is unreliable. The SHA tag satisfies the rollback requirement. Semantic version tags can be applied manually to significant releases using `git tag -a v1.0.0` and pushed to the repository.

**SSH access is secured by private key authentication rather than IP allowlisting.**

In an automated pipeline context, IP-based allowlisting is not a viable access control boundary for SSH. GitHub Actions runners are allocated dynamically from a large pool of addresses across GitHub's published IP ranges, and those ranges change. The security group inbound rule for port 22 is set to `0.0.0.0/0`, and the authentication boundary is the 2048-bit RSA private key stored in GitHub Secrets. A connection attempt from any source IP without the matching private key is rejected at the authentication layer. This is the standard architectural position for SSH-based deployment pipelines: keep the network boundary open and rely on cryptographic authentication rather than attempting to maintain an accurate IP allowlist against a dynamic source.

---

## The actual tradeoff

**What it costs:**

The pipeline introduces a layer of infrastructure that must be maintained alongside the application. The workflow files are code. When GitHub Actions changes its runner environment, updates a pre-built action's API, or deprecates a Node.js version, the workflow files break and require a fix before any deployment can proceed. A shell script on a local machine has none of these external dependencies. The pipeline also adds six minutes of latency between a push and a live change, compared to five minutes of manual deployment. For a developer fixing a production bug, that difference is felt.

Opening SSH port 22 to all source IPs increases the attack surface on EC2. Any machine on the internet can attempt an SSH connection to `54.144.96.188`. The private key stored in GitHub Secrets is the only authentication mechanism protecting that surface. The key is a 2048-bit RSA key pair. Brute-forcing it is computationally infeasible with current hardware, but the surface exposure is measurable.

**What it gives:**

A deployment that required fourteen manual steps and five minutes of active work now requires one `git push`. The entire sequence runs without the developer touching anything after the push. Every run produces an identical sequence of steps in an identical environment, eliminating the category of failures caused by executing steps in the wrong order or with stale credentials.

The commit SHA tag on every image means the registry holds a complete history of every version ever deployed. Any version is recoverable in under two minutes without rebuilding from source.

---

## At small scale (one developer, personal project deployed to users)

A solo developer shipping a product to users typically does not provision EC2, write GitHub Actions workflow files, or manage GitHub Secrets. The common choice in 2025 is a platform that handles deployment entirely. Railway, Render, and Fly.io accept a repository or a Docker image and handle server provisioning, TLS certificates, container restarts, and environment variable injection without the developer touching a cloud console. The frontend goes to Vercel or Netlify, both of which build from a Git repository on every push and serve over HTTPS with no configuration. Built-in CI/CD on these platforms means there are no workflow files to write and no pipeline infrastructure to maintain. The base cost of the application server and frontend hosting at this scale is typically between five and twenty dollars per month, before database add-ons.

---

## At medium scale (startup, five to ten engineers, a live product)

A team at this size typically deploys more frequently than a solo developer and across more than one active branch. Manual deployment is no longer viable because no single developer owns the deployment process. Any developer's push must reach production without requiring a colleague to execute steps on their behalf.

At this scale the pipeline gains a test stage before the build stage. The JAR is not built until the test suite passes. A failing test in CI blocks the deployment before any artifact is produced. The team adds branch protection rules requiring a passing pipeline on every pull request before it can be merged to `main`. The deployment target moves from a manually managed EC2 instance to a managed container service such as ECS Fargate or Google Cloud Run, which handles container placement and health checks and performs rolling updates without requiring SSH access to any server. Secrets move from GitHub Secrets to a dedicated secrets manager such as AWS Secrets Manager or HashiCorp Vault, where they are injected into the container at runtime via an IAM role rather than passed as environment variables on the command line.

---

## At large scale (hundreds of engineers, millions of users)

At this scale no engineer SSHes into a production server. Production access is gated behind break-glass procedures with full audit logging. The pipeline system is not GitHub Actions running on shared runners. It is a dedicated internal deployment platform with dedicated hardware, SLA guarantees on pipeline execution time, and integration with the company's internal service registry. Companies like Netflix and Meta run internal deployment platforms. Spinnaker at Netflix and Conveyor at Meta are documented examples where the pipeline itself is versioned, tested, and treated as production software. A YAML file maintained by whoever last touched it does not exist at this scale.

The deployment strategy is blue-green or canary. A new version is deployed alongside the existing version. Traffic is shifted incrementally, starting at a small percentage and increasing based on error rate metrics. If the error rate for the new version exceeds a threshold, traffic is shifted back automatically without human intervention. The concept of stopping a container and starting a new one, which creates a downtime window, does not exist in this model.

Feature flags decouple deployment from release. Code is deployed to production in a disabled state and enabled for a subset of users through a configuration change rather than a new deployment. The pipeline's job is to get code to production. What gets exposed to users, and when, is decided separately by product teams.

---

## TLDR

The fourteen-step manual deployment sequence from Module 13 is now two GitHub Actions workflow files. A push to `server/**` builds the JAR, pushes a Docker image to ECR tagged with the commit SHA, and deploys to EC2 over SSH. A push to `client/**` builds the React app and syncs the output to S3 with a CloudFront invalidation. Every sensitive value is stored in GitHub Secrets, port 22 was opened to GitHub's runner IPs, and `--restart unless-stopped` was added to close the EC2 reboot gap from Module 13.
