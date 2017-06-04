import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { stratify, tree } from 'd3-hierarchy'
import { path } from 'd3-path'
import uniqueid from 'lodash.uniqueid'

const data = [
  {"name": "Root", "parent": ""},
  {"name": "A1", "parent": "Root"},
  {"name": "A2", "parent": "Root"},
  {"name": "B1", "parent": "A2"},
  {"name": "C1", "parent": "B1"},
  {"name": "A3", "parent": "Root"},
  {"name": "A4", "parent": "Root"},
  {"name": "C2", "parent": "B1"},
  {"name": "A5", "parent": "Root"}
]

const s = stratify()
  .id((d) => d.name)
  .parentId((d) => d.parent)

const curveVertical = (source, size) => {
  const context = path()
  const [x0, y0] = [source.x, source.y]
  context.moveTo(x0, y0)
  source.children.forEach((target, i) => {
    const [x1, y1] = [target.x, target.y - size.node.height]
    const yMid = y0 + size.link.height / 2
    if (i === 0) {
      context.lineTo(x0, yMid)
    }
    const yHalf = (y1 - yMid) / 2
    const xTenth = (x0 - x1) / 10
    context.moveTo(x0, yMid)
    context.bezierCurveTo(x0 - xTenth, y1 - yHalf, x1 + xTenth, yMid + yHalf, x1, y1)
  })
  return context.toString()
}

const hideChildren = (structure) => {
  structure.each((node) => {
    node.data.hasChildren = !!node.children
    if (!node.parent) {
      return
    }
    if (node.data.hide) {
      node.children = null
    }
  })
  return structure
}

const linkStyle = {
  fill: 'none',
  stroke: '#555',
  strokeOpacity: '0.4',
  strokeWidth: '1.5px',
}

class Card extends Component {

  static propTypes = {
    data: PropTypes.object.isRequired,
    size: PropTypes.object.isRequired,
    onAddNode: PropTypes.func.isRequired,
    onToggleNode: PropTypes.func.isRequired
  }

  onAddNode = (e) => {
    e.stopPropagation()
    this.props.onAddNode(this.props.data)
  }

  onToggleNode = () => {
    if (this.props.data.hasChildren) {
      this.props.onToggleNode(this.props.data)
    }
  }

  render() {
    const style = {
      border: '1px solid black',
      backgroundColor: 'white',
      width: this.props.size.width,
      height: this.props.size.height,
    }
    return (
      <div
        style={ style }
        onClick={ this.onToggleNode }
      >
        { this.props.data.name }
        <button
          onClick={ this.onAddNode }
        >
          Add New Node
        </button>
        <div>
          has children: { `${this.props.data.hasChildren}` }
        </div>
      </div>
    )
  }

}

export class Root extends Component {

  static propTypes = {
    data: PropTypes.object.isRequired,
    size: PropTypes.object.isRequired,
    onAddNode: PropTypes.func.isRequired,
  }

  onAddNode = (e) => {
    e.stopPropagation()
    this.props.onAddNode(this.props.data)
  }

  render() {
    const style = {
      border: '1px solid black',
      backgroundColor: 'white',
      width: this.props.size.width,
      height: this.props.size.height / 2,
      margin: 0,
    }
    return (
      <h1
        style={ style }
      >
        Root
        <button
          onClick={ this.onAddNode }
        >
          Add New Node
        </button>
      </h1>
    )
  }

}

export class Tree extends Component {

  ref
  curDown
  curDownX
  curDownY
  curDownScrollLeft
  curDownScrollTop

  constructor(props) {
    super(props)
    this.state = { data }
  }

  setRef = (div) => {
    this.ref = div
  }

  onMouseMove = (e) => {
    if (this.curDown){
      e.currentTarget.scrollLeft = this.curDownScrollLeft - (e.clientX - this.curDownX)
      e.currentTarget.scrollTop = this.curDownScrollTop - (e.clientY - this.curDownY)
    }
  }

  onMouseDown = (e) => {
    this.curDownX = e.clientX
    this.curDownY = e.clientY
    this.curDownScrollLeft = e.currentTarget.scrollLeft
    this.curDownScrollTop = e.currentTarget.scrollTop
    this.curDown = true
  }

  onMouseUp = () => {
    this.curDown = false
  }

  onAddNode = (nodeData) => {
    const newData = this.state.data.concat([{
      name: uniqueid(nodeData.name),
      parent: nodeData.name,
    }])
    this.setState({ data: newData })
  }

  onToggleNode = (nodeData) => {
    const newData = this.state.data.map((data) => {
      return data.name !== nodeData.name ? data : {
        ...nodeData,
        hide: !nodeData.hide
      }
    })
    this.setState({ data: newData })
  }

  renderPaths(root, size) {
    const paths = root.descendants().filter((node) => node.children).map((node) => {
      return (
        <path
          key={ node.id }
          d={ curveVertical(node, size) }
          style= { linkStyle }
          transform={ `translate(0,${size.node.height / 2})` }
        />
      )
    })
    return (
      <svg
        width={ size.width + size.margin.left + size.margin.right }
        height={ size.height + size.margin.top + size.margin.bottom }
      >
        <g transform={ `translate(${size.width / 2 + size.margin.left},${size.margin.top})` }>
          { paths }
        </g>
      </svg>
    )
  }

  renderRootNode(node, size) {
    const style = {
      position: 'absolute',
      top: '0px',
      left: '0px',
      transform: `translate(${node.x - size.node.width / 2}px,${node.y}px)`,
    }
    return (
      <div
        key={ node.id }
        style={ style }
      >
        <Root
          data={ node.data }
          size={ size.node }
          onAddNode={ this.onAddNode }
        />
      </div>
    )
  }

  renderChildNode(node, size) {
    const style = {
      position: 'absolute',
      top: '0px',
      left: '0px',
      transform: `translate(${node.x - size.node.width / 2}px,${node.y - size.node.height / 2}px)`,
    }
    return (
      <div
        key={ node.id }
        style={ style }
      >
        <Card
          data={ node.data }
          size={ size.node }
          onAddNode={ this.onAddNode }
          onToggleNode={ this.onToggleNode }
        />
      </div>
    )
  }

  renderNodes(root, size) {
    const nodes = root.descendants().map((node) => {
      return node.parent ? this.renderChildNode(node, size) : this.renderRootNode(node, size)
    })
    const style = {
      position: 'absolute',
      top: '0px',
      left: '0px',
      transform: `translate(${size.width / 2 + size.margin.left}px,${size.margin.top}px)`,
    }
    return (
      <div
        style={ style }
      >
        { nodes }
      </div>
    )
  }

  render() {
    const structure = hideChildren(s(this.state.data))
    const size = {
      link: {
        height: 96
      },
      node: {
        width: 370,
        height: 150
      },
      margin: {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100,
      }
    }
    const root = (tree()
      .nodeSize([size.node.width, size.link.height + size.node.height])
      .separation((a, b) => a.parent == b.parent ? 1.1 : 2) // eslint-disable-line eqeqeq
    )(structure)

    const descendants = root.descendants()
    size.height = Math.max.apply(Math, descendants.map((node) => node.y)) + size.node.height * 2
    size.width = 2 * Math.max.apply(Math, descendants.map((node) => node.x)) + size.node.width * 2
    const style = {
      position: 'absolute',
      overflow: 'auto',
      width: '100%',
      height: '100%',
      userSelect: 'none'
    }
    return (
      <div
        style={ style }
        onMouseMove={ this.onMouseMove }
        onMouseDown={ this.onMouseDown }
        onMouseUp={ this.onMouseUp }
        onMouseOut={ this.onMouseUp }
      >
        { this.renderPaths(root, size) }
        { this.renderNodes(root, size) }
      </div>
    )
  }

}
