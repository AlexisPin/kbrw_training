var cn = require('../utils').default
var createReactClass = require('create-react-class')
var remoteProps = require('../props.js').default
var HTTP = require('../http.js').default
var React = require("react")
var { getBrowserState, setBrowserState } = require("../state.js")

const Orders = createReactClass({
  statics: {
    remoteProps: [remoteProps.orders]
  },
  getInitialState() {
    return {
      flashMessage: '',
      page: this.props.qs.page ? parseInt(this.props.qs.page) / 30 : 0,
      rows: this.props.qs.rows ? parseInt(this.props.qs.rows) : 30,
      sort: this.props.qs.sort || 'creation_date_index'
    }
  },
  paginate(page) {
    this.props.loader(
      new Promise((resolve) => {
        this.setState({ page }, () => {
          this.props.Link.GoTo("orders", null, { page: this.state.page * this.state.rows, rows: this.state.rows, sort: this.state.sort });
          resolve();
        });
      })
    );
  },
  quantities(quantityArray) {
    if (!quantityArray || !quantityArray.length) return 0;
    return quantityArray.reduce((acc, quantity) => acc + quantity, 0);
  },
  onSearch(ev) {
    ev.preventDefault();
    const formData = new FormData(ev.target)
    const searchValue = formData.get('search')
    const [key, value] = searchValue.split(':')
    this.props.Link.GoTo("orders", null, { page: this.state.page, [key]: value });
  },
  updateOrderStatus(id, status) {
    let action = ''
    if (status === 'not_verified') action = 'verify'
    else if (status === 'init') action = 'pay'
    else return
    const url = `/api/order/${id}/${action}`
    this.props.loader(
      HTTP.put(url).then((updatedOrder) => {
        let browserState = getBrowserState();
        const newOrdersValue = browserState.orders.value.map(order => {
          return order.id === updatedOrder.id ? {
            ...order,
            "status.state": updatedOrder.status.state
          } : order
        }
        );
        browserState = {
          ...browserState,
          orders: {
            ...browserState.orders,
            value: newOrdersValue
          }
        }
        setBrowserState({ ...browserState });
        this.props.Link.GoTo("orders", null, { page: this.state.page * this.state.rows, rows: this.state.rows, sort: this.state.sort });
      }).catch((err) => {
        this.setState({ flashMessage: err.message.error }, () => {
          setTimeout(() => this.setState({ flashMessage: '' }), 3000)
        })

      })
    )
  },
  render() {
    return <JSXZ in="orders" sel=".orders">
      <Z sel=".form" onSubmit={(ev) => this.onSearch(ev)}>
        <ChildrenZ />
      </Z>
      <Z sel=".orders-container" if={this.state.flashMessage} >{this.state.flashMessage}</Z>
      <Z sel=".tab-body">
        {(this.props.orders?.value || []).map(order => {
          return (
            <JSXZ in="orders" sel=".tab-line" key={order.remoteid}>
              <Z sel=".col-1">{order.remoteid}</Z>
              <Z sel=".col-2">{order["custom.customer.full_name"]}</Z>
              <Z sel=".col-3">{order["custom.billing_address.street"].join(', ')} {order["custom.billing_address.postcode"]} {order["custom.billing_address.city"]}</Z>
              <Z sel=".col-4">{this.quantities(order["custom.items.quantity_to_fetch"])}</Z>

              <Z
                sel=".col-5">
                <this.props.Link to="order" params={order.id} query={{ page: this.state.page * this.state.rows, rows: this.state.rows, sort: this.state.sort }}>
                  <ChildrenZ />
                </this.props.Link>
              </Z>

              <Z tag="button" sel=".pay-button" if={order["status.state"] !== 'finished'} onClick={() => this.updateOrderStatus(order.id, order["status.state"])}>{
                order["status.state"] === 'init' ? 'Pay' : 'Verify'} <ChildrenZ /></Z>
              <Z sel=".pay-status">State : {order["status.state"] || 'N/A'}</Z>
              <Z sel=".pay-method">Method: {order["custom.magento.payment.method"] || 'N/A'}</Z>

              <Z sel=".col-7" onClick={() => this.props.modal({
                type: 'delete',
                title: 'Order deletion',
                message: `Are you sure you want to delete this ?`,
                callback: (value) => {
                  if (value) {
                    const url = `/api/order/${order.id}`;
                    this.props.loader(
                      HTTP.delete(url)
                        .then(() => {
                          const browserState = getBrowserState();
                          delete browserState.orders
                          console.error(browserState)
                          setBrowserState(browserState);
                          this.props.Link.GoTo("orders", null, { page: this.state.page * this.state.rows, rows: this.state.rows, sort: this.state.sort });
                        })
                    );
                  }
                }
              })}>
                <ChildrenZ />
              </Z>
            </JSXZ>)
        })}
      </Z>

      <Z
        sel=".first-page"
        tag="button"
        className={cn({ 'hidden': this.state.page < 2, classNameZ })}
        onClick={() => this.paginate(0)}
      >
        <ChildrenZ />
      </Z>
      <Z
        sel=".prev-page"
        tag="button"
        className={cn({ 'hidden': this.state.page == 0, classNameZ })}
        onClick={() => this.paginate(this.state.page - 1)}
      >
        {this.state.page}
      </Z>
      <Z sel=".current-page">{this.state.page + 1}</Z>
      <Z
        sel=".next-page"
        tag="button"
        className={cn({ 'hidden': (this.props.orders?.value || []).length < this.state.rows })}
        onClick={() => this.paginate(this.state.page + 1)}
      >
        {this.state.page + 2}
      </Z>
    </JSXZ>
  }
})

module.exports = Orders;
