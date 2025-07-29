var createReactClass = require('create-react-class')

var Page = createReactClass({
  render() {
    const menu = ["home", "about", "contact"]
    return <JSXZ in="template" sel="nav">
      <Z sel="nav a" tag="button" to={menu[indexZ]}><ChildrenZ /></Z>
    </JSXZ >
  }
})

ReactDOM.render(
  <Page />,
  document.getElementById('root')
)
