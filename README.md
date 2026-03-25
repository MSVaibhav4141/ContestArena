# ContestArena

ContestArena is a high-performance, self-hosted competitive programming platform. It provides real-time code judging, live contest management, and low-latency leaderboards. The platform is built to handle heavy concurrent workloads, executing and validating up to 1000+ test cases per submission through a custom distributed remote code execution (RCE) engine.

<img width="1833" height="848" alt="image" src="https://github.com/user-attachments/assets/2a00b7e9-81ec-4b48-ab5e-7bd94529c29d" />  
*Landing page showcasing the platform's core offering.*

## Core Features

* **Self-Hosted Job Orchestrator (j0):** A custom execution engine that securely compiles and runs user code against large(1000+) test suites.
* **Real-Time Live Arena:** Low-latency contest timelines and leaderboards powered by WebSockets and Redis Pub/Sub.
* **Interactive Coding Workspace:** Integrated Monaco Editor with a resizable split-pane layout, live console outputs, and multi-language support.
* **Granular Access Control:** Atomic state management for contest timelines, ensuring problem sets remain securely locked until the exact start time.
* **Enterprise-Grade UI:** A highly polished, accessible dark-mode interface built with Tailwind CSS and Framer Motion.

## System Architecture

ContestArena's backend is designed to handle the primary bottleneck of competitive programming platforms: validating massive test case objects safely and quickly.

### The j0 Orchestrator & Testcase Chunking

<img width="2636" height="1348" alt="image" src="https://github.com/user-attachments/assets/00035c48-ed87-42ca-9797-700a7360a047" />
*Internal flow of the j0 orchestrator and worker processes.*

Sending monolithic string payloads for 1000+ test cases to an execution worker is memory-intensive and prone to timeouts. Instead, ContestArena uses a dynamic chunking architecture:
1. **Queueing:** Submissions enter the `j0` Orchestrator Queue.
2. **Memory & Storage:** The worker process checks if the required test cases are in memory. If not, it fetches them from AWS S3 (for large payloads) or the primary database (for small payloads based on `SET_SIZE`).
3. **Chunking & Load Balancing:** The test case object is chunked into smaller batches (e.g., 10 to 100 cases per chunk, depending on the target worker's CPU constraints). 
4. **Distributed Execution:** A load balancer distributes these chunks across multiple `j0server` batch workers for parallel execution.

### Submission & Real-Time Polling Flow

<img width="1827" height="713" alt="image" src="https://github.com/user-attachments/assets/6e61ba17-5622-43fc-9ead-12e6567c689b" />
*Code submission, schema generation, and polling lifecycle.*

To provide a seamless UX during code execution, the platform utilizes a hybrid polling mechanism:
* When a user submits code, a schema is created and the full execution code is generated and queued.
* The frontend immediately initiates a fast-polling cycle against a high-speed Redis Cache rather than hammering the primary database.
* Once the progress reaches 100%, the system performs a final fetch from the database or S3 to retrieve the persistent, verified results and updates the frontend state.

## Application Interfaces

### Interactive Code Workspace
The workspace is designed for deep focus, utilizing an A/B split layout. The left pane houses the problem description and submission history, while the right pane contains the Monaco code editor, language selector, and execution console.

<img width="1838" height="838" alt="Screenshot 2026-03-25 210726" src="https://github.com/user-attachments/assets/9029408a-6bf6-46d7-be3e-e5e1a738d1b9" />

### Live Leaderboard
Rankings are updated dynamically as participants successfully pass test cases. The leaderboard utilizes WebSocket connections to ensure all connected clients view the same persistent state during an active contest.

<img width="1866" height="763" alt="Screenshot 2026-03-25 210854" src="https://github.com/user-attachments/assets/b6c16225-c186-4bfd-a8a1-c27767c1870f" />

### Admin OS
The platform includes a restricted-access administration portal. It provides real-time telemetry on active contests, total submissions, user growth, and features a dedicated queue for approving or rejecting community-submitted coding problems.

<img width="1860" height="744" alt="Screenshot 2026-03-25 212100" src="https://github.com/user-attachments/assets/62fa6778-b976-46a7-8b97-8bd11b4f0172" />

## Tech Stack
* **Frontend:** Next.js, React, Tailwind CSS, Framer Motion
* **Architecture:** Monorepo(Turborepo)
* **Editor:** Monaco Editor
* **Backend:** Next.js Server Actions, Node.js (for j0 orchestrator workers)
* **Database:** PostgreSQL with Prisma ORM
* **Caching & Real-Time:** Redis (Pub/Sub)
* **Cloud & Security:** AWS S3 (Blob storage), AWS IAM (Role-based access), AWS SSM (Parameter Store for secure credentials)
