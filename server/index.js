const express = require('express');
const { client,
        lorem,
        createTables,
        createComment,
        createUser,
        createItem,
        createReview,
        fetchItems,
        fetchSingleItem,
        fetchItemReviews,
        fetchSingleReview,
        authenticate,
        findUserByToken,
        getMyReviews,
        editReview,
        deleteReview,
        getMyComments, 
        editComment,
        deleteComment
 } = require('./db');
const app = express();
app.use(express.json());
app.use(require('morgan')('dev'))
require('dotenv').config


// Middleware for isLoggedIn
const isLoggedIn = async(req, res, next) => {
    try {
        console.log(req.headers.authorization);
        req.headers.authorization = req.headers.authorization.replace(
            "Bearer ",
            ""
        )
        req.user = await findUserByToken(req.headers.authorization)
        console.log(req.user)
        next()
    } catch (error) {
        next(error)
    }
}

//   GET /api/items
app.get("/api/items", async (req, res, next) => {
    try {
        res.send(await fetchItems())
    } catch (error) {
        next(error)
    }
})


//   GET /api/items/:id
app.get("/api/items/:id", async (req, res, next) => {
    try {
        res.send(await fetchSingleItem(req.params.id))
    } catch (error) {
        next(error)
    }
})


//   POST /api/auth/register
app.post("/api/auth/register", async (req, res, next) => {
    try {
        res.status(201).send(await createUser({username: req.body.username, password: req.body.password}))
    } catch (error) {
        next(error)
    }
})


//   POST /api/auth/login
app.post("/api/auth/login", async(req,res,next) => {
    try {
        res.status(202).send(await authenticate({username: req.body.username, password: req.body.password}))
    } catch (error) {
        next(error)
    }
})


//   GET /api/auth/me (isLoggedIn)
  
app.get("/api/auth/me", isLoggedIn, async(req, res, next) => {
    try {
        const user = req.user
        console.log(user);
        res.send(user)
    } catch (error) {
        next(error)
    }
})


//   GET /api/items/:itemId/reviews
app.get("/api/items/:itemId/reviews", async (req,res,next) => {
    try {
        res.status(200).send(await fetchItemReviews(req.params.itemId))
    } catch (error) {
        next(error)
    }
})


//   GET /api/items/:itemId/reviews/:id
app.get("/api/items/:itemId/reviews/:id", async (req,res,next) => {
    try {
        res.status(200).send(await fetchSingleReview(req.params.id))
    } catch (error) {
        next(error)
    }
})


//   POST /api/items/:itemId/reviews (isLoggedIn)
app.post("/api/items/:itemId/reviews", isLoggedIn, async (req, res, next) => {
    try {
        res.status(202).send(await createReview({
            text: req.body.text, 
            rating: req.body.rating, 
            itemId: req.params.itemId, 
            userId: req.user.id}))
    } catch (error) {
        next(error)
    }
})



//   GET /api/reviews/me (isLoggedIn)
app.get("/api/reviews/me", isLoggedIn, async( req, res, next) => {
    try {
        res.send(await getMyReviews(req.user.id))
    } catch (error) {
        next(error)
    }
})


//   PUT /api/users/:userId/reviews/:id (isLoggedIn)
app.put("/api/users/:userId/reviews/:id", isLoggedIn, async(req, res, next) => {
    if (req.user.id !== req.params.userId) {
        const error = Error('Not Authorized')
        error.status(401)
        throw error
    }
    try {
        res.status(202).send(await editReview({text: req.body.text, rating: req.body.rating, reviewId: req.params.id}))
    } catch (error) {
        next(error)
    }
})


//   DELETE /api/users/:userId/reviews/:id (isLoggedIn)
app.delete("/api/users/:userId/reviews/:id", isLoggedIn, async(req, res, next) => {
    if (req.user.id !== req.params.userId) {
        const error = Error('Not Authorized')
        error.status(401)
        throw error
    }
    try {
        await deleteReview({userId: req.params.userId, reviewId: req.params.id})
        res.sendStatus(204)
    } catch (error) {
        next(error)
    }
}) 

  
//   POST /api/items/:itemId/reviews/:id/comments (isLoggedIn)

app.post("/api/items/:itemId/reviews/:id/comments", isLoggedIn, async (req, res, next) => {
    try {
        res.status(202).send(await createComment(
            {text: req.body.text, 
             reviewId: req.params.id, 
             userId: req.body.userId}))
    } catch (error) {
        next(error)
    }
})


//   GET /api/comments/me (isLoggedIn)
app.get("/api/comments/me", isLoggedIn, async( req, res, next) => {
    try {
        res.send(await getMyComments(req.user.id))
    } catch (error) {
        next(error)
    }
})



//   PUT /api/users/:userId/comments/:id (isLoggedIn)
app.put("/api/users/:userId/comments/:id", isLoggedIn, async(req, res, next) => {
    if (req.user.id !== req.params.userId) {
        const error = Error('Not Authorized')
        error.status(401)
        throw error
    }
    try {
        res.status(202).send(await editComment({text: req.body.text, commentId: req.params.id}))
    } catch (error) {
        next(error)
    }
})



//   DELETE /api/users/:userId/comments/:id (isLoggedIn)
app.delete("/api/users/:userId/comments/:id", isLoggedIn, async(req, res, next) => {
    if (req.user.id !== req.params.userId) {
        const error = Error('Not Authorized')
        error.status(401)
        throw error
    }
    try {
        await deleteComment({userId: req.params.userId, commentId: req.params.id})
        res.sendStatus(204)
    } catch (error) {
        next(error)
    }
}) 





const init = async () => {
    await client.connect()
    console.log("connected");
    createTables()
    const [kam, chels, max] = await Promise.all([
        createUser({username: "kam", password: "kam123"}),
        createUser({username: "chels", password: "chels123"}),
        createUser({username: "max", password: "max123"})
    ])

    const [hydroflask, mouse, airpods, coaster] = await Promise.all([
        createItem({name:"hydroflask", text:"32oz insulated water mug"}),
        createItem({name:"mouse", text:"wireless, black, clicks"}),
        createItem({name:"airpods", text:"bluetooth, in a green rubber case"}),
        createItem({name:"coaster", text:"put your drinks on it, its square"}),
    ])

    const [review1, review2, review3, review4] = await Promise.all([
        createReview({text: lorem(50), rating: 4, itemId: hydroflask.id, userId: kam.id}),
        createReview({text: lorem(29), rating: 3, itemId: mouse.id, userId: kam.id}),
        createReview({text: lorem(75), rating: 5, itemId: airpods.id, userId: chels.id}),
        createReview({text: lorem(37), rating: 1, itemId: coaster.id, userId: max.id})
    ])

    createComment({text: lorem(110), reviewId: review1.id, userId: chels.id}),
    createComment({text: lorem(90), reviewId: review2.id, userId: max.id}),
    createComment({text: lorem(40), reviewId: review3.id, userId: kam.id}),
    createComment({text: lorem(15), reviewId: review4.id, userId: chels.id}),

    app.listen(process.env.PORT, console.log(`liseting on port ${process.env.PORT}`))
}

init()