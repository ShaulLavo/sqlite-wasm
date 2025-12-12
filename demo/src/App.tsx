import { ParentProps } from 'solid-js';
import { A } from '@solidjs/router';
import './App.css';

function App(props: ParentProps) {
  return (
    <div class="container">
      <nav class="nav-tabs">
        <A href="/" end activeClass="active">
          Main Thread
        </A>
        <A href="/worker" activeClass="active">
          Worker
        </A>
        <A href="/opfs" activeClass="active">
          OPFS
        </A>
        <A href="/sah-pool" activeClass="active">
          SAH Pool
        </A>
      </nav>

      {props.children}
    </div>
  );
}

export default App;
