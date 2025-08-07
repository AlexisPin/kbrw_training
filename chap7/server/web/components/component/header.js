var createReactClass = require('create-react-class')
var React = require("react")

const Header = createReactClass({
  render() {
    return <JSXZ in="orders" sel=".header">
      <Z sel=".header-container">
        <this.props.Child {...this.props} />
      </Z>
    </JSXZ>
  }
})

module.exports = Header;