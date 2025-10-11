const { Router } = require('express')
const userRouter = require('./user.routes')
const categoryRouter = require('./category.routes')
const restaurantRouter = require('./restaurant.routes')
const productRouter = require('./product.routes')
const orderRouter = require('./order.routes')
const couponRouter = require('./coupon.routes')
const tableRouter = require('./table.routes')
const router = Router();

router.use('/user', userRouter)
router.use('/restaurant', restaurantRouter)
router.use('/category', categoryRouter)
router.use('/product', productRouter)
router.use('/order', orderRouter)
router.use('/coupon', couponRouter)
router.use('/table', tableRouter)

module.exports = router;