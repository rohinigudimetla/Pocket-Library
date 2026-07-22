# Module 13: AWS

---

## What the app needs right now

Every value that changes between environments was hardcoded. `application.properties` pointed `spring.datasource.url` at `localhost:5432` and `spring.redis.host` at `localhost`. The Spring Boot process could only run on its development machine. PostgreSQL and Redis ran as local processes on the same machine. The React build fetched from `http://localhost:8080`. The application had no environment separation between development and any external host.

Module 13 replaces every hardcoded address with an environment variable reference and packages the Spring Boot server in a Docker image. That image runs against managed AWS infrastructure. The React build goes to S3. CloudFront serves it. Nginx on EC2 terminates SSL for the API.

---

## What I'm not doing yet

- No CI/CD pipeline. Every deploy in this module is a manual sequence of Maven, Docker, and AWS CLI commands. Module 14 automates this.
- No Elastic IP on the EC2 instance. The public IP changes on every instance restart, which requires a manual Route 53 A record update before the API is reachable. This is deferred to Module 14 when the deployment pipeline is automated.
- No token refresh mechanism. This remains open from Module 9.
- The SSE endpoint still passes the token as a query parameter. This exposes the token in Nginx access logs. The ticket-based alternative is documented in Module 12 and remains open.
- `RequestsPage.tsx` and the dead Sidebar link remain open from Module 11.
- No cancel-request capability for Readers.
- No endpoint for updating a book's `pagesRead` on the backend.
- Redis persistence (AOF or RDB) is not configured on ElastiCache. A cluster restart loses the JWT signing key and the blacklist Set. On restart, `JwtService` generates a new key, which invalidates every active token. That is an acceptable tradeoff at this scale because it reproduces the same behavior that existed before Module 12.

---

## The simple path

The Spring Boot JAR could run directly on an EC2 instance with Java installed manually, PostgreSQL and Redis running as processes on that same instance. This avoids Docker, RDS, ElastiCache, ECR, and VPC security group configuration entirely. The entire stack runs as three processes on one machine.

The simpler frontend path is an S3 static website URL with no CloudFront and no custom domain. That path was ruled out because S3 static website hosting serves files over HTTP only. CloudFront is the layer that adds HTTPS. Without HTTPS on the frontend, the browser blocks every API call to `https://api.pocklib.site` as a mixed content violation. The HTTPS requirement on the frontend forced CloudFront into the architecture.

---

## What I did instead and why

**Every hardcoded value in `application.properties` was replaced with an environment variable reference.**

`spring.datasource.url=${DB_URL}`, `spring.datasource.username=${DB_USERNAME}`, `spring.datasource.password=${DB_PASSWORD}`, `spring.data.redis.host=${REDIS_HOST:localhost}`, `spring.data.redis.port=${REDIS_PORT:6379}`, and `spring.data.redis.ssl.enabled=${REDIS_SSL:false}` are now the complete set of connection properties. The fallback values (`localhost`, `6379`, `false`) let the application start in development without an `.env` file populated. On EC2, the Docker `run` command supplies the environment-specific values. The file on disk never changes between environments. The operating system hands the process its environment-specific values at startup.

**The Spring Boot server is packaged as a Docker image.**

A book tracker with two users has no operational need for Docker. The JAR runs fine with `java -jar` on any machine with Java 25 installed. Docker exists here because the curriculum premise is production-grade architecture applied to a simple premise, and Docker is the standard unit of deployment in cloud-native production Java environments today. Without it, deploying a new version of the application means SSH-ing into EC2, stopping the running process, copying the new JAR, and restarting manually. With it, deploying is a `docker pull` and `docker run`. `server/Dockerfile` uses `eclipse-temurin:25-jre` as the base image, which provides a minimal Linux filesystem with Java 25 already installed. `COPY target/server-0.0.1-SNAPSHOT.jar app.jar` places the JAR into the image's filesystem. `EXPOSE 8080` documents the port. `CMD ["java", "-jar", "app.jar"]` defines the startup command. The image is pushed to ECR and pulled onto EC2. The image embeds the Java version, JAR location, and startup command instead of requiring manual configuration per host.

**RDS runs PostgreSQL instead of running PostgreSQL on EC2.**

Putting PostgreSQL on EC2 alongside Spring Boot means both the application and the database fail together when the EC2 instance has a problem. It also means owning the full operational burden of the database process. RDS handles backups automatically, applies minor version patches automatically, and runs in a separate lifecycle from the application server. The RDS instance for this deployment is `db.t4g.micro` on the free tier. The endpoint `pocketlibrary.ca90sg8k47nw.us-east-1.rds.amazonaws.com` goes into `DB_URL`. Liquibase runs its changesets against RDS on first startup exactly as it does locally. No schema changes were needed.

**ElastiCache runs Redis instead of running Redis on EC2.**

The same reasoning that applies to PostgreSQL applies to Redis. A Redis process on EC2 adds operational responsibility with no architectural benefit at this scale. The ElastiCache cluster provisioned is `cache.t4g.micro`. AWS enabled cluster mode by default on this cluster. Cluster mode uses a different connection protocol than standalone Redis and requires a different Spring configuration property: `spring.data.redis.cluster.nodes` with the configuration endpoint, rather than the standalone `spring.data.redis.host` property that local development uses. The `REDIS_SSL=true` environment variable activates TLS on the Lettuce client to match the cluster's transit encryption requirement. Local development continues to use standalone Redis by injecting `REDIS_HOST` and `REDIS_PORT` instead. The two environments now use different Redis connection modes, which is a divergence the simple path of Redis on EC2 would not have introduced.

**Three VPC security groups enforce the network boundary.**

`pocketlibrary-ec2` allows inbound TCP on port 8080 from anywhere and SSH on port 22 from my IP. `pocketlibrary-rds` allows inbound TCP on port 5432 only from `pocketlibrary-ec2`. `pocketlibrary-elasticache` allows inbound TCP on port 6379 only from `pocketlibrary-ec2`. Both RDS and ElastiCache are inside the default VPC with no public access. A connection attempt to the RDS endpoint from outside the VPC times out at the network layer before any authentication challenge is issued.

**The React build is served from S3 with CloudFront in front.**

`npm run build` produces the `dist/` folder. `aws s3 sync dist/ s3://pocketlibrary-frontend` uploads every file. CloudFront distribution `E1UOITER1J5NAH` points at the S3 static website endpoint as its origin. Static website hosting on the bucket designates `index.html` as both the index document and the error document. Setting `index.html` as the error document allows React Router to handle client-side routes without S3 returning a 404. CloudFront custom error responses for 403 and 404 both return `index.html` with a 200 status for the same reason.

**Nginx terminates SSL for the API.**

CloudFront serves the frontend over HTTPS. A browser will not issue HTTP requests from an HTTPS page. The API therefore also needed HTTPS. An Application Load Balancer would have solved this but costs approximately $16 per month. Nginx installed on the EC2 instance with a Let's Encrypt certificate from Certbot achieves the same result for free. Nginx listens on port 443, terminates TLS using the certificate at `/etc/letsencrypt/live/api.pocklib.site/fullchain.pem`, and proxies requests to `http://localhost:8080`. Port 80 redirects to HTTPS. Spring Boot continues to receive unencrypted HTTP on 8080 and is unaware that TLS is in use. The tradeoff relative to a load balancer is that Let's Encrypt certificates expire after 90 days and require Certbot's renewal process to run correctly on the instance. ACM certificates attached to a load balancer renew automatically with no intervention required.

**Route 53 and ACM provide DNS and the SSL certificate.**

The domain `pocklib.site` was registered through Namecheap. Namecheap's nameservers were replaced with the four Route 53 nameservers assigned to the hosted zone. Two DNS records were created: an A record at the apex pointing at the CloudFront distribution, and an A record at `api.pocklib.site` pointing at the EC2 public IP. The ACM certificate covers both `pocklib.site` and `*.pocklib.site` and was validated via DNS by adding the CNAME record that ACM generates into the Route 53 hosted zone. The CloudFront distribution has `pocklib.site` as its alternate domain name and the ACM certificate attached, which is what allows the browser to reach `https://pocklib.site` without an SSL warning.

**The CORS allowed origins list was updated in `SecurityConfig`.**

`configuration.setAllowedOrigins(List.of("http://localhost:5173", "https://pocklib.site"))` replaces the single `localhost:5173` entry from Module 9. Without this update, the browser's preflight `OPTIONS` request to `https://api.pocklib.site/api/auth/login` returns a 403 from Spring Security before the login request is ever issued. The CORS configuration is the boundary between which frontend origins the backend treats as trusted. Adding `https://pocklib.site` to that list is a required architectural change on every new environment where the frontend is deployed.

**CloudWatch captures Docker container logs.**

Spring Boot writes all logs to stdout. Docker captures stdout to a JSON log file at `/var/lib/docker/containers/*/*.log`. The CloudWatch agent on EC2 reads that path and ships the lines to the log group `/pocketlibrary/docker`. The agent is registered as a systemd service so it starts automatically on reboot.

---

## The actual tradeoff

The overengineering in this module has a specific shape: RDS instead of PostgreSQL on EC2, ElastiCache instead of Redis on EC2, CloudFront instead of raw S3, and Nginx instead of a load balancer. Each decision adds cost and operational complexity in exchange for something concrete.

**RDS instead of PostgreSQL on EC2** means PostgreSQL has its own failure domain. If EC2 crashes, the database survives. The tradeoff is that RDS costs money even when stopped, through provisioned storage charges, and introduces a network round trip on every database call that a local process would not have. For PocketLibrary, the network latency is imperceptible. The storage cost is approximately $2.30 per month for 20GB.

**ElastiCache instead of Redis on EC2** follows the same pattern. The tradeoff specific to this deployment is that cluster mode was enabled by default, which introduced a divergence between the local environment (standalone Redis) and the deployed environment (cluster mode Redis). These two modes use different connection protocols and different Spring configuration properties. A developer who runs the application locally against standalone Redis and deploys against cluster mode ElastiCache is working with two environments that behave identically at the application level but require different configuration paths to reach. The simple path of Redis on EC2 would not have introduced that divergence.

**CloudFront instead of raw S3** adds approximately 15 to 50 milliseconds of latency reduction for users outside us-east-1. For a portfolio project with one user located in Boston, the performance difference is not measurable. The reason CloudFront is here is HTTPS, not performance. S3 static website hosting does not support HTTPS on a custom domain. CloudFront adds HTTPS and the ACM certificate attachment point. The tradeoff is one additional cache invalidation step required on every frontend deploy.

**Nginx instead of a load balancer** saves approximately $16 per month. The tradeoff is that Nginx runs as a process on the same EC2 instance as Spring Boot. Let's Encrypt certificates expire after 90 days. A load balancer with an ACM certificate has no expiry concern because ACM handles renewal automatically. Nginx also provides no health check integration with Route 53. If Spring Boot crashes, Nginx continues to accept connections on port 443 and returns 502 to every request until a human restarts the container.

---

## At small scale (one developer, personal project deployed to users)

A solo developer shipping a product to users does not provision EC2, RDS, and ElastiCache manually. The standard choice in 2025 is a platform that handles the infrastructure layer entirely. Railway, Render, and Fly.io all accept a Docker image or a repository and handle server provisioning, TLS certificates, and domain configuration without the developer touching a cloud console. The database runs as a managed add-on on the same platform. Redis, if needed at all, is another add-on. The frontend goes to Vercel or Netlify, both of which build from a Git repository on every push and serve over HTTPS with no configuration. The entire deployed stack costs between $5 and $20 per month and requires no IAM, no VPC, and no security group configuration.

---

## At medium scale (startup, five to ten engineers, a live product)

A startup at this size typically has at least one engineer who owns infrastructure alongside application work. Deployment is not a manual SSH process at this point. The backend runs on ECS Fargate or a similar managed container service that pulls the Docker image, runs it, handles health checks, and replaces unhealthy containers automatically. The team writes a task definition once and the platform handles the rest. There are no EC2 instances to patch, no Nginx processes to monitor, and no Certbot renewals to track. TLS terminates at an Application Load Balancer using an ACM certificate. RDS and ElastiCache are sized for the actual traffic rather than the free tier, and ElastiCache has persistence enabled. Secrets live in AWS Secrets Manager, injected into the container at runtime via an IAM task role rather than passed in environment variables on the command line. The frontend deploys from CI to S3 and CloudFront on every merge to main, with no manual steps.

---

## At large scale (hundreds of engineers, millions of users)

At this scale, a common architectural pattern is decomposing the application into services by domain boundary: one service owns books, another owns requests, another owns authentication. This is not a certainty. Many companies at this size run well-architected monoliths and decompose only when a specific service has scaling or deployment requirements that cannot be met within the monolith. Where decomposition has happened, each service typically has its own repository, its own RDS instance or schema, and its own deployment pipeline. The container orchestration layer is Kubernetes, running on EKS. Each service runs as a Deployment with a configured replica count. Spreading pods across multiple availability zones requires explicit topology spread constraints or node affinity rules in the Deployment configuration. The ALB in front of the cluster routes traffic to pods via an Ingress controller. Horizontal Pod Autoscaler scales individual services based on CPU or request rate metrics without human intervention.

RDS runs with a primary instance handling writes and one or more read replicas handling reads. Routing reads to a replica requires a secondary datasource configured in Spring that points at the replica endpoint, with `@Transactional(readOnly = true)` on service methods signaling which datasource to use. The `readOnly` annotation alone does not route to a replica unless the datasource configuration explicitly maps it.

ElastiCache runs Redis Cluster across multiple shards with at least one replica per shard. A single shard failure does not take down the cache layer because ElastiCache promotes a replica automatically. The Lettuce cluster client handles slot-based routing across shards transparently.

The frontend build and deployment runs in a CI pipeline with no manual steps. Secrets are never passed in environment variables on a command line. They are injected from a secrets management system, either AWS Secrets Manager or HashiCorp Vault, into the running container via the orchestration layer's secret injection mechanism.

---

## TLDR

Spring Boot runs in Docker on EC2. PostgreSQL on RDS. Redis on ElastiCache. Both behind VPC security groups that accept traffic only from EC2. React on S3 behind CloudFront at `https://pocklib.site`. Nginx handles SSL for the API at `https://api.pocklib.site`. CloudWatch captures the logs.
