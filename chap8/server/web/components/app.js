require('!!file-loader?name=[name].[ext]!../index.html')
/* required library for our React app */
var React = require("react")

/* required css for our application */
require('../webflow/css/orders.css');
require('../webflow/css/order.css');
require('../webflow/css/loader.css');
require('../webflow/css/modal.css');

var { inferPropsChange, Link } = require("./component/link.js")
var { getBrowserState, setBrowserState } = require("./state.js")

var Child = require("./component/child.js")
var ErrorPage = require("./component/error.js")

export default {
  reaxt_server_render(params, render) {
    inferPropsChange(params.path, params.query, params.cookies)
      .then(() => {
        const browserState = getBrowserState()
        render(<Child {...browserState} />)
      }, (err) => {
        render(<ErrorPage message={"Not Found :" + err.url} code={err.http_code} />, err.http_code)
      })
  },
  reaxt_client_render(initialProps, render) {
    setBrowserState(initialProps)
    Link.renderFunc = render
    window.addEventListener("popstate", () => { Link.onPathChange() })
    Link.onPathChange()
  }
}
