# Stage 0: a loop with one model call

- Prediction: the program prints one reply and exits.
- Result: matched.
- Gap: none.
- Blocker: knowledge (how the API returns errors).
- Break exercise and diagnosis: removed the key, got a 401, diagnosed it as config not code.
- Explain-back: "a request carries everything the model sees; nothing is remembered between calls".
- Misses to revisit: timeout handling.
- Rebuild notes for the next stage: the loop needs to survive being moved into an image, so config must come from the environment.
