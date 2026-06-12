# Boltapp Monorepo - AI Code Generator (Bolt.new Clone)

A high-performance, full-stack monorepo clone of Bolt.new / Bolt.diy. This platform allows users to describe web applications in plain English, generates the source code using Gemini, launches a fully containerized workspace, hosts an embedded VS Code editor (code-server), and runs a live preview server on host port `8081`.

---

## 🏗 System Architecture

The codebase is organized as a Turbopack/npm workspaces monorepo:

```mermaid
graph TD
    User(["Browser Client"]) <--> |"HTTP/WS"| Frontend["apps/frontend: Next.js"]
    Frontend <--> |"HTTP"| PrimaryBackend["apps/primarybackend: Express"]
    Frontend <--> |"WS"| WSRelayer["apps/ws_layer: WS Relayer"]
    
    PrimaryBackend <--> |"DB Queries"| Database[("PostgreSQL")]
    
    subgraph "AWS Cloud Infrastructure (Production)"
        Orchestrator["apps/worker-orchestrator: Express"] <--> |"AWS ASG API"| ASG["AWS Auto Scaling Group"]
        ASG <--> |"Provisions"| EC2["EC2 Sandbox Instance"]
        
        subgraph "EC2 Instance Workspace (Per Project)"
            WSRelayer <--> |"WS"| Worker["apps/worker: Prompt Processor & Dev Runner"]
            Worker <--> |"Actions DB"| Database
            Worker -.-> |"Hosts Preview"| PreviewPort["Live App Preview: 8081"]
            Worker -.-> |"Volume Mount"| CodeServer["apps/code-server: Monaco IDE"]
        end
    end
    
    Frontend <--> |"Requests Workspace IP"| Orchestrator
```


### 1. Applications (`apps/`)

*   **[frontend](file:///Users/rahulchaudhary/cohort/devops/boltapp/apps/frontend)**: Next.js App Router UI featuring:
    *   Clerk Authentication.
    *   Interactive chat window for submitting prompts and showing real-time file creation logs.
    *   Embedded Code Editor running VS Code (via `code-server`).
    *   Responsive, live preview container mapping directly to the generated app's dev server.
*   **[primarybackend](file:///Users/rahulchaudhary/cohort/devops/boltapp/apps/primarybackend)**: Express.js server providing REST APIs for project creation, loading conversation history, and project details.
*   **[ws_layer](file:///Users/rahulchaudhary/cohort/devops/boltapp/apps/ws_layer)**: WebSocket relayer bridging real-time communication events between the client and the worker execution context.
*   **[worker](file:///Users/rahulchaudhary/cohort/devops/boltapp/apps/worker)**: Node.js container handling LLM generation execution:
    *   Streams prompt responses from Google Gemini.
    *   Processes file artifacts (creates, updates, deletes files).
    *   Executes shell commands sequentially inside the project workspaces.
    *   Hosts the active development servers on port `8081`.
*   **[worker-orchestrator](file:///Users/rahulchaudhary/cohort/devops/boltapp/apps/worker-orchestrator)**: Auto-scaling service for AWS Auto Scaling Groups (ASG) designed to scale remote `code-server` instances.

### 2. Shared Packages (`packages/`)

*   **[db](file:///Users/rahulchaudhary/cohort/devops/boltapp/packages/db)**: Prisma ORM configurations and shared PostgreSQL database client wrapper.
*   **[redis](file:///Users/rahulchaudhary/cohort/devops/boltapp/packages/redis)**: Shared Redis client initialization package.
*   **[ui](file:///Users/rahulchaudhary/cohort/devops/boltapp/packages/ui)**: Shared stub React UI components library.
*   **eslint-config / typescript-config**: Linting and compiler setups unified across packages.

---

## ☁️ Cloud Architecture & Worker Orchestration (AWS)

In production deployments, instead of hosting local containerized workspaces on a single host machine, the platform shifts to a dynamically scalable cloud architecture managed by the **[worker-orchestrator](file:///Users/rahulchaudhary/cohort/devops/boltapp/apps/worker-orchestrator)**. 

This service communicates directly with Amazon Web Services (AWS) using the `@aws-sdk/client-auto-scaling` and `@aws-sdk/client-ec2` libraries.

### 1. Dynamic Sandbox Provisioning Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant Frontend as Frontend App
    participant Orchestrator as Worker Orchestrator
    participant AWS as AWS Auto Scaling
    participant EC2 as EC2 Instances

    Client->>Frontend: Request Project Sandbox
    Frontend->>Orchestrator: GET /:projectId
    alt Idle machine available in pool
        Orchestrator-->>Frontend: Return Machine IP
        Frontend-->>Client: Load embedded VS Code & Preview
    else No idle machines
        Orchestrator->>AWS: Scale Out ASG (SetDesiredCapacity)
        Orchestrator-->>Frontend: Return 503 "No idle machines"
        AWS->>EC2: Spin up new instances
        Note over Orchestrator,EC2: Background sync loop registers new instances into warm pool
    end

    Note over Client,EC2: After use / shutdown
    Client->>Frontend: Delete / Close Sandbox
    Frontend->>Orchestrator: POST /destroy (machineId)
    Orchestrator->>AWS: Terminate instance & decrement desired capacity
    AWS->>EC2: Terminate VM instance
```

### 2. Operational Details

*   **Instance Discovery & Synchronization**: 
    The orchestrator runs a background loop every 10 seconds (`refreshInstances()`) that:
    1. Describes the instances in the `vscode-asg` AWS Auto Scaling Group.
    2. Queries the AWS EC2 API (`DescribeInstancesCommand`) to fetch their IP addresses and public status.
    3. Synchronizes them with the `All_MACHINES` registry.
*   **Warm Buffer / Scaling Up**: 
    To minimize VM launch latency for active users, the orchestrator guarantees a buffer of **at least 5 idle instances**. If the available idle pool drops below 5, it proactively invokes `SetDesiredCapacityCommand` to scale out the Auto Scaling Group.
*   **Resource Teardown**: 
    When a user destroys a sandbox, the orchestrator terminates the associated instance via `TerminateInstanceInAutoScalingGroupCommand` (with `ShouldDecrementDesiredCapacity: true`), reducing active instance counts to control cloud infrastructure costs.

---

## 🔌 Port Mappings & Services

The system is deployed containerized via Docker. Below is the mapping of host-accessible endpoints and their corresponding Docker Hub images:

| Service | Docker Hub Image | Port (Container) | Port (Host) | Description |
| :--- | :--- | :---: | :---: | :--- |
| **frontend** | `rahulchaudharyji/bolty-frontend:latest` | `3000` | **`3002`** | Next.js User Interface |
| **primary-backend** | `rahulchaudharyji/bolty-primary-backend:latest` | `3000` | **`3000`** | Project & Database APIs |
| **ws-relayer** | `rahulchaudharyji/bolty-ws-relayer:latest` | `9093` | **`9093`** | WebSocket relayer server |
| **worker** (API) | `rahulchaudharyji/bolty-worker:latest` | `9091` | **`9091`** | Prompts runner API |
| **worker** (Preview) | *Dynamic (Generated App)* | `8081` | **`8081`** | Live preview of generated applications |
| **code-server** | `codercom/code-server:latest` | `8080` | **`8080`** | Embedded VS Code Web Interface |
| **postgres-db** | `postgres:16-alpine` | `5432` | **`5433`** | PostgreSQL DB Instance |
| **redis-db** | `redis:alpine` | `6379` | **`6380`** | Redis Caching Instance |

---

## 🚀 Getting Started

### Prerequisites

*   Docker & Docker Compose.
*   Node.js (v18+) & Bun package manager (optional, for running locally).
*   A Gemini API Key.

### 🛠 Deployment with Docker Compose

1.  **Environment Setup**: Configure your environment variables in a root `.env` file (refer to the [.env.example](file:///Users/rahulchaudhary/cohort/devops/boltapp/.env.example) template).
2.  **Pull Pre-Built Images**: Pull the images directly from Docker Hub to avoid local build latency:
    ```bash
    docker compose pull
    ```
3.  **Start the Stack**: Launch all containerized services:
    ```bash
    docker compose up -d
    ```
4.  **Local Builds (Alternative)**: If you make custom changes to the source code and want to rebuild the images locally:
    ```bash
    docker compose up -d --build
    ```
5.  Open [http://localhost:3002](http://localhost:3002) in your browser to access the application.

---

## 🔧 Internal Features & Fixes implemented

1.  **Safety in Command Chains**: Updated the command processor inside the worker (`os.ts`) to execute chained commands (e.g., `npm install && npm run dev`) sequentially instead of concurrently. The script now waits for the previous command in the chain to exit with status `0` before proceeding, preventing build errors like `next: not found`.
2.  **Boilerplate Template Initializer**: The worker now pre-populates all new workspace directories on creation with corresponding baseline files (like `app/layout.tsx` for Next.js, or `package.json` for React/Vite) before the AI edits it, avoiding issues such as missing root layouts.
3.  **Google Fonts Turbopack Fix**: Removed `next/font/google` references from Next.js template layouts to fix compilation crashes associated with turbopack font resolutions in Docker containers.
