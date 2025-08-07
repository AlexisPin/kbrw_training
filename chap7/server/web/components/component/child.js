var React = require("react")
var createReactClass = require('create-react-class')

var Child = createReactClass({
  render() {
    var [ChildHandler, ...rest] = this.props.handlerPath
    return <ChildHandler {...this.props} handlerPath={rest} />
  }
})

module.exports = Child;
