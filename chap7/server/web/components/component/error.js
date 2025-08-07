var React = require("react")
var createReactClass = require('create-react-class')

const ErrorPage = createReactClass({
  render() {
    return <div>
      <h1>Error {this.props.code}</h1>
      <p>{this.props.message}</p>
    </div>
  }
})

module.exports = ErrorPage;
