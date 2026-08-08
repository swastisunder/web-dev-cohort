# Node.js Internals & Architecture — Notes

> Clean rewrite of your handwritten notes. Simple English, organized so nothing is missed.

---

## 1. How JavaScript Runs in a Browser

Every browser has its own JavaScript **engine** built in:

| Browser | JS Engine |
|---|---|
| Chrome | V8 |
| Firefox | SpiderMonkey |
| Safari | JavascriptCore |

The engine's job is simply to **run JavaScript code**.

---

## 2. Core JavaScript Is Actually Very Basic

Plain JavaScript (the language itself) is simple. On its own, it can only do things like:

- Create and call functions
- Create variables
- Basic math / logic
- `console.log()` — wait, actually not even this (see below 👇)

Core JavaScript **cannot**, by itself:
- Call APIs
- Use `setTimeout` / `setInterval`
- Do anything asynchronous
- Access the DOM

> 💡 **Important:** `console.log`, `setTimeout`, `fetch`, DOM access, Promises — none of these are part of the JavaScript language itself. They are **provided by the environment** (the browser) that runs the JS engine.

**Where do these features come from then?**
The **browser** adds them on top of the JS engine. This is why they're called **Web APIs**. The engine just runs your JS; the browser gives it superpowers like DOM, `fetch`, timers, etc.

---

## 3. How Node.js Was Created

JavaScript needs a "host" to run outside the browser. That host is written in **C++**.

**The story (Ryan Dahl):**
- Ryan Dahl took the **V8 engine** (the same engine from Chrome — it's just plain JS, nothing browser-specific)
- He pulled it out of the browser
- He embedded V8 inside a **C++** program, so it could run on your local machine as a runtime
- He added a library called **libuv**, which gives Node.js:
  - The **Event Loop**
  - The **Thread Pool**

**The formula:**
```
V8 (JS Engine) + C++ (host) + libuv (event loop + thread pool) = Node.js
```

**Key point:** JavaScript syntax is the same in the browser and in Node.js, but **how it runs internally is different** — because the browser gives you Web APIs, while Node.js gives you libuv (event loop, file system, networking, etc.) instead.

> 📝 "Standard output" = your terminal (not a browser window). `console.log` isn't even part of core JS — it's a feature added by whichever environment (browser or Node) you're running in.

---

## 4. What Happens When You Run `node filename.js`

Running this command creates a **Node.js process**.

### Execution order (this is the important part):

1. **Initialize the project/process**
2. **Run all top-level code, top to bottom** — this includes:
   - Import/require statements
   - Any plain code sitting outside a function (variables, if/else, loops, etc.)
   - Registering callbacks (e.g. `setTimeout`, `fs.readFile`, event listeners) — registering just means "Node notes this callback down for later," it does **not** run it yet
3. **Once all top-level code finishes running, the Event Loop starts**
4. The Event Loop now runs registered callbacks whenever their condition is met (timer expired, file finished reading, etc.)
5. When there is **nothing left pending**, the process exits

**What counts as "top-level code"?**
Any code that is *not* inside a function — written directly in the file.

```js
console.log('Hello from NodeJs');   // top-level
const a = 2 + 2;                    // top-level
console.log('a', a);                // top-level
```

---

## 5. The Main Thread

- Node.js gives your JS code **one main thread** to run on.
- This is the *only* thread you have for running your actual JavaScript code.
- If this thread gets **blocked** or **killed**, your entire program stops working — nothing else can run.

> ⚠️ **Never write blocking code** (like a heavy infinite loop or long synchronous computation) directly in the main thread — it freezes everything.

---

## 6. Process Signals

When you run a server (e.g. Express), it keeps running forever until you stop it — usually with `Ctrl + C`. This sends a **signal** to the process, telling it to shut down gracefully.

Common Unix signals:

| Signal | Number (typical) | Meaning |
|---|---|---|
| `SIGHUP` | 1 | Hang up |
| `SIGINT` | 2 | Interrupt (usually `Ctrl + C`) |
| `SIGQUIT` | 3 | Quit |
| `SIGKILL` | 9 | Force-kill — **cannot be caught or ignored** |
| `SIGTERM` | 15 | Polite termination request |
| `SIGSTOP` | 19 | Stop the process — **cannot be caught or ignored** |

> Exact numbers can vary slightly by OS — the important part is what each signal *means*, and that `SIGKILL`/`SIGSTOP` can never be intercepted.

**Example — cleanup before exit:**
```js
process.on('SIGINT', () => {
  console.log('Do the cleanup');
  process.exit();
});
```
This runs your cleanup code first, *then* exits — instead of the process dying instantly.

---

## 7. The Event Loop

Once all top-level code has run, the Event Loop starts. Think of it as a loop that keeps checking "is there anything to do?"

### Simplified pseudocode:
```
while (true) {
  ExpiredCallbacks()     // 1. Timers
  IOPolling()             // 2. I/O tasks (file reads, network, etc.)
  SetImmediate()          // 3. setImmediate callbacks
  CloseCallbacks()        // 4. close events (sockets, files, servers closing)

  if (nothing pending) {
    exit
  } else {
    continue
  }
}
```

### The 4 phases explained:

| Phase | What it does |
|---|---|
| **1. Timers (Expired Callbacks)** | Runs any `setTimeout` / `setInterval` callbacks whose time has already expired. This is checked **first** in every loop cycle. |
| **2. I/O Polling** | Runs callbacks for finished I/O tasks — e.g. `fs.readFile` completing. |
| **3. `setImmediate`** | Runs callbacks scheduled with `setImmediate()`. This only exists in Node.js — **not available in browsers**. |
| **4. Close Callbacks** | Runs callbacks for "closing" events — e.g. a socket disconnecting, a file finishing its close operation, a server shutting down. |

**Why is there a "pending?" check?**
Without it, the loop would run forever even with nothing to do. So after every cycle, Node checks: *is anything still pending (a timer waiting, I/O in progress, a setImmediate queued)?*
- **Yes** → keep looping
- **No** → exit the process

---

## 8. Timers vs I/O — Order Matters

- The Event Loop **always checks Timers first**, every single cycle.
- If you set `setTimeout(fn, 30000)` (30 sec), the loop keeps cycling and checking — it only runs `fn` once 30 seconds have actually passed.

**Interview-style question:** *"If top-level code takes 50 seconds to run, and you had `setTimeout(fn, 2000)` (2 sec), when does the timer run?"*
**Answer:** Immediately after top-level code finishes — because the 2-second timer was already counting down in the background *while* the 50-second top-level code was running. If the timer was 60 seconds instead, it would fire 10 seconds *after* top-level code finishes (60 − 50 = 10).

---

## 9. The Thread Pool (libuv)

JavaScript itself is **single-threaded** — only one thing runs at a time on the main thread.

But Node.js (via libuv) gives you a **thread pool** — a group of extra worker threads that can run tasks in the background.

- **Default size: 4 threads**
- You can change it with:
  ```js
  process.env.UV_THREADPOOL_SIZE = 8;
  ```
  (Set this **before** any async calls that use the pool — ideally right at the top of your file.)

### Who goes where — Event Loop or Thread Pool?

| Task type | Handled by |
|---|---|
| Synchronous / async I/O like `fs.readFile`, timers, network | **Event Loop** (via I/O polling) |
| CPU-intensive tasks — cryptography, hashing, encryption | **Thread Pool** |

> This decision is **not something you control** — Node.js already decides internally which tasks go to the thread pool vs the event loop.

**How it works:**
1. A CPU-heavy task (e.g. password hashing) comes in.
2. The Event Loop does **not** wait or block — it hands the task off to a free thread in the pool.
3. The thread pool works on it in the background.
4. The Event Loop keeps "polling" (checking back) — is the thread pool done yet?
5. When done, the callback runs.

**Practical effect:** If you run 4 heavy hashing operations at once with the default pool size of 4, they all get a thread and finish around the same time. Add a **5th** one, and it has to *wait* for a thread to free up — roughly doubling its wait time.

---

## 10. Dry-Run Examples (Practice Tracing the Output)

### Example 1 — Basic timer vs top-level
```js
import fs from 'fs';

setTimeout(() => console.log('Hello from Timer'), 0);
console.log('Hello from Top level code');
```
**Output:**
```
Hello from Top level code
Hello from Timer
```
Top-level code always finishes first. The timer callback only runs once the Event Loop starts.

---

### Example 2 — Timer vs setImmediate (no I/O)
```js
setTimeout(() => console.log('Hello from Timer'), 0);
setImmediate(() => console.log('Hello from Immediate'));
console.log('Hello from Top Level code');
```
**Output:**
```
Hello from Top Level code
Hello from Timer
Hello from Immediate
```
Since `console.log` (synchronous work) runs before the loop starts, a tiny bit of time passes — often enough for the 0ms timer to have already "expired" by the time the loop begins, so Timers phase runs before the Check (`setImmediate`) phase.

---

### Example 3 — Adding I/O (`fs.readFile`)
```js
setTimeout(() => console.log('Hello from Timer'), 0);
setImmediate(() => console.log('Hello from Immediate'));
fs.readFile('sample.txt', 'utf-8', (err, data) => {
  console.log('File reading Complete...');
});
console.log('Hello from Top level code');
```
**Output:**
```
Hello from Top level code
Hello from Timer
Hello from Immediate
File reading Complete...
```
You can't predict exactly how long file reading takes (depends on file size), so it hasn't finished by the time the loop reaches the I/O polling phase. The loop moves on to `setImmediate` while the read is still happening in the background — which is why `setImmediate` often finishes before I/O.

---

### Example 4 — Scheduling more callbacks *inside* an I/O callback
```js
setTimeout(() => console.log('Hello from Timer'), 0);
setImmediate(() => console.log('Hello from Immediate'));

fs.readFile('sample.txt', 'utf-8', (err, data) => {
  console.log('File reading Complete...');
  setTimeout(() => console.log('Time 2'), 0);
  setTimeout(() => console.log('Time 3'), 0);
  setImmediate(() => console.log('Immediate 2'));
});

console.log('Hello from top level code');
```
**Output:**
```
Hello from top level code
Hello from Timer
Hello from Immediate
File reading Complete...
Immediate 2
Time 2
Time 3
```
**Why `Immediate 2` beats `Time 2`/`Time 3`:** Since the file-read callback runs *during* the I/O polling phase, any `setImmediate` scheduled inside it runs in the **Check phase right after**, in the same loop cycle. The new `setTimeout`s have to wait for the **next** loop cycle's Timers phase — so they run last, in the order they were registered.

---

### Example 5 — Thread pool in action (`crypto.pbkdf2`)
```js
import crypto from 'crypto';
const start = Date.now();

// 4 password-hashing calls (default thread pool size = 4)
crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha256', () =>
  console.log('Password 1 hashed', Date.now() - start));
crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha256', () =>
  console.log('Password 2 hashed', Date.now() - start));
crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha256', () =>
  console.log('Password 3 hashed', Date.now() - start));
crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha256', () =>
  console.log('Password 4 hashed', Date.now() - start));

console.log('Hello from top level code');
```
**What happens:**
- All 4 hashing calls run **in parallel**, each grabbing one of the 4 default threads.
- They finish at roughly the same time (small variations depending on system load).
- If you add a **5th** `pbkdf2` call, it has to *wait* for a thread to become free — so it takes roughly **double** the time.
- You can increase the pool size with `process.env.UV_THREADPOOL_SIZE = 8` to allow more parallel CPU tasks.

---

### Example 6 — Order changes based on what's *before* the timer/immediate
```js
setTimeout(() => console.log('Hello from Timer'), 0);
setImmediate(() => console.log('Hello from Immediate'));
console.log('Hello from top level code');
```
Behaves the same as Example 2 — with synchronous code before the loop starts, `Timer` tends to print before `Immediate`.

---

### Example 7 — Timer vs Immediate with NOTHING else before them
```js
setTimeout(() => console.log('Hello from Timer'), 0);
setImmediate(() => console.log('Hello from Immediate'));
```
**Output:**
```
Hello from Immediate
Hello from Timer
```
**Why the order flips here:** With no synchronous work (like `console.log`) before the loop starts, Node enters the Event Loop almost instantly — likely *before* even 1ms has passed. Since `setTimeout` has a minimum delay (~1ms) and belongs to the **Timers** phase, it isn't "expired" yet on the first pass, so it gets skipped that round. The loop continues to the **Check** phase, running `setImmediate` first. On the next loop cycle, the 1ms has now passed, so `Timer` finally runs.

> 🔑 **Golden rule:** `setTimeout` vs `setImmediate` order **depends on the timing context** they're called in — not on which one you wrote first in your code.

---

## 11. Quick Revision Cheat Sheet

- **Core JS** has no `setTimeout`, no `fetch`, no DOM, no async — the **environment** (browser or Node) adds all that.
- **Node.js = V8 (JS engine) + C++ (host) + libuv (event loop + thread pool)**
- Running `node file.js` → creates a **process** → runs **top-level code first** → then **starts the Event Loop**
- **Main thread** = the only thread running your JS. Block it, and everything stops.
- **Event Loop phases (in order, every cycle):** Timers → I/O Polling → `setImmediate` (Check) → Close Callbacks → check if anything pending → loop or exit
- **`setImmediate` is Node-only** — doesn't exist in browsers.
- **Thread pool** (libuv) handles **CPU-intensive** work (crypto, hashing, encryption) — default size is **4**, changeable via `process.env.UV_THREADPOOL_SIZE`.
- Inside an I/O callback, any `setImmediate()` scheduled there **always** runs before any `setTimeout()` scheduled there, because it fires in the same loop cycle.
- With no other sync code, `setImmediate` often finishes before a `setTimeout(fn, 0)` — because the loop starts before the timer's ~1ms minimum has elapsed.
- `SIGKILL` and `SIGSTOP` **cannot** be caught or ignored by your code; `SIGINT` (Ctrl+C) and `SIGTERM` can be caught for graceful shutdown.