

module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQuantity = oldCart.totalQuantity || 0;
    this.totalPrice = oldCart.totalPrice || 0;
    this.paymentMethod = oldCart.paymentMethod || 'COD';

    this.gettotalQuantity = () => {
        var quantity = 0;
        for (var id in this.items) {
            quantity += parseInt(this.items[id].quantity);
        }
        return quantity;
    };
    this.gettotalPrice = () => {
        var price = 0;
        for (var id in this.items) {
            price += parseFloat(this.items[id].price);
        }
        price =parseFloat(price).toFixed(2);
        return price;
    };
    this.add = (items, id, quantity) => {
        var storeItem = this.items[id];
        if (!storeItem) {
            this.items[id] = { items: items, quantity: 0, price: 0 };
            storeItem = this.items[id];
        }
        storeItem.items.price = parseFloat(storeItem.items.price);
        storeItem.quantity += parseInt(quantity);
        storeItem.price = parseFloat(storeItem.items.price * storeItem.quantity.quantity);
        this.totalQuantity = this.gettotalQuantity();
        this.totalPrice = this.gettotalPrice();
        return this.getCartItem(items)
    };
    this.generateArray = () => {
        var arr = [];
        for (var id in this.items) {
            this.items[id].items.price = parseFloat(this.items[id].items.price).toFixed(2)
            this.items[id].price = parseFloat(this.items[id].price).toFixed(2);
            arr.push(this.items[id]);
        };
        return arr;
    };
    this.getCart = (id) => {
        var Cart = {
            items: this.generateArray(),
            totalQuantity : this.totalQuantity,
            totalPrice : this.totalPrice,
            paymentMethod : this.paymentMethod
        }
        return Cart;
    };
    this.getCartItem = (id) => {
        var CartItem ={
            items :this.items[id],
            totalQuantity:this.totalQuantity,
            totalPrice: this.totalPrice
        }
        return CartItem
    };
    this.empty = (id) => {
        this.items ={};
        this.totalPrice=0;
        this.totalQuantity=0;
    };
    this.remove = (id) => {
        var storeItem =this.items[id];
        if(storeItem){
            delete this.items[id];
            this.totalPrice=gettotalQuantity();
            this.totalQuantity=gettotalPrice;
        }
    };
}