const { Router } = require('express')
const userRouter = require('./user.routes')
const categoryRouter = require('./category.routes')
const storeRouter = require('./store.routes')
const productRouter = require('./product.routes')
const cartRouter = require('./cart.routes')
const paymentRouter = require('./payment.routes')
const orderRouter = require('./order.routes')
const addressRouter = require('./address.routes')
const router = Router();

router.use('/user', userRouter)
router.use('/address', addressRouter)
router.use('/category', categoryRouter)
router.use('/store', storeRouter)
router.use('/product', productRouter)
router.use('/cart', cartRouter)
router.use('/payment', paymentRouter)
router.use('/order', orderRouter)

module.exports = router;