import React, { Component } from 'react'
import { Tree } from './Tree'

class App extends Component {
  render() {
    const style = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }
    return (
      <main style={ style }>
        <Tree />
      </main>
    )
  }
}

export default App
