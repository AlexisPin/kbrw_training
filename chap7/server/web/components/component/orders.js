var cn = require('../utils').default
var createReactClass = require('create-react-class')
var remoteProps = require('../props.js')
var HTTP = require('../http.js').default
var React = require("react")

const Orders = createReactClass({
  statics: {
    remoteProps: [remoteProps.orders]
  },
  getInitialState() {
    return {
      page: 0
    }
  },
  paginate(page) {
    this.setState({
      page: Math.max(0, page)
    }, () => {
      delete browserState.orders;
      goTo("orders", null, { page: this.state.page });
    });
  },
  render() {
    const orders = this.props.orders?.value || [];
    return <JSXZ in="orders" sel=".orders">
      <Z sel=".tab-body">
        {orders.map(order => {
          return (
            <JSXZ in="orders" sel=".tab-line" key={order.remoteid}>
              <Z sel=".col-1">{order.remoteid}</Z>
              <Z sel=".col-2">{order["custom.customer.full_name"]}</Z>
              <Z sel=".col-3">{order["custom.billing_address.street"][0]} {order["custom.billing_address.postcode"]} {order["custom.billing_address.city"]}</Z>
              <Z sel=".col-4">{(order["custom.items.quantity_to_fetch"] || []).length}</Z>

              <Z
                sel=".col-5"
                onClick={() => goTo("order", order.id, null)}>
                <ChildrenZ />
              </Z>

              <Z tag="button" sel=".pay-button">Pay <ChildrenZ /></Z>
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
                        .then((res) => {
                          delete browserState.orders;
                          goTo("orders", null, { page: this.state.page });
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
        className={cn({ 'hidden': this.state.page < 2 })}
        onClick={() => this.paginate(0)}
      >
        <ChildrenZ />
      </Z>
      <Z
        sel=".prev-page"
        tag="button"
        className={cn({ 'hidden': this.state.page == 0 })}
        onClick={() => this.paginate(this.state.page - 1)}
      >
        {this.state.page}
      </Z>
      <Z sel=".current-page">{this.state.page + 1}</Z>
      <Z
        sel=".next-page"
        tag="button"
        onClick={() => this.paginate(this.state.page + 1)}
      >
        {this.state.page + 2}
      </Z>
    </JSXZ>
  }
})

module.exports = Orders;