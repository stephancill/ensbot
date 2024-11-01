# ensbot

A bot to send messages to ENS name owners when their names are expiring.

## Usage

Fill in the `.env.local` file with your Dune API key and Warpcast API key. (see `.env.sample` for reference)

```
pnpm install
```

Run the worker and Bull Board:

```
pnpm run start  
```

Run the task to fetch the latest expirations and queue jobs:

```
pnpm run task
```
