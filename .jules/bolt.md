## 2024-05-18 - Memoize dynamic React list components
**Learning:** In dynamic chat interfaces like `SorcaSession`, passing rapidly changing props like `totalMessages` (array length) to child message components forces all previous messages to re-render whenever a new message is added, even if their own content hasn't changed.
**Action:** Utilize `React.memo` for list items and remove any rapidly changing but unused or unnecessary props to prevent unnecessary re-renders during frequent parent state updates.
