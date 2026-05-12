/**
 * components/HelloWorld.tsx
 *
 * A simple React component used as part of the initial extension scaffold.
 * It demonstrates basic React state (useState) and prop usage.
 *
 * Note: This component is currently used in the Popup UI (src/popup/App.tsx)
 * but is not part of the core scraping logic.
 */

import { useState } from "react"

export default function HelloWorld(props: { msg: string }) {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>{props.msg}</h1>

      <div className="card">
        <button type="button" onClick={() => setCount(count + 1)}>
          count is {count}
        </button>
        <p>
          Edit
          <code>src/components/HelloWorld.tsx</code> to test HMR (Hot Module
          Replacement)
        </p>
      </div>

      <p>
        Check out
        <a
          href="https://github.com/crxjs/create-crxjs"
          target="_blank"
          rel="noreferrer"
        >
          create-crxjs
        </a>
        , the official starter for CRXJS.
      </p>

      <p className="read-the-docs">
        Click on the Vite, React and CRXJS logos to learn more.
      </p>
    </>
  )
}
