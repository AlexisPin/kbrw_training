const createReactClass = require('create-react-class')

const Page = createReactClass({
  render() {
    const menu = ["home", "about", "contact"]
    return <JSXZ in="template" sel=".container">
      <JSXZ in="template" sel=".navbar">
        <Z sel="a" tag="button" to={menu[indexZ]}><ChildrenZ /></Z>
      </JSXZ>
      <JSXZ in="template" sel=".item">
        <Z sel=".item">Burgers</Z>,
        <Z sel=".price">50</Z>
      </JSXZ>
    </JSXZ >
  }
})

const handleClick = () => {
  ReactDOM.render(<div>Hello, from React!</div>, document.getElementById("root"));
  <>
    <Declaration var="test1" value="42" />
    <Declaration var="test2" value={42} />
  </>;
  console.log(test1);
  console.log(test2);
}

window.handleClick = handleClick

ReactDOM.render(<Page />,
  document.getElementById('root')
)
