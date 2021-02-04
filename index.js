const Koa = require('koa');
const axios = require('axios');
const path = require('path');
const render = require('koa-ejs');
const koaRouter = require('koa-router');
const dotenv = require('dotenv');
const koaBody = require('koa-body');
const graphqlQuery = require('./helpers/graphql_query');

dotenv.config();
const app = new Koa();
const router = new koaRouter();

const token = Buffer.from(`${process.env.API_USER}:${process.env.API_PASS}`, 'utf8').toString('base64');

app.use(koaBody());
app.use(async (ctx, next) => {
    ctx.state.message = '';
    try {
        await next();
    } catch (err) {
        console.error(err);
        ctx.state.message = ctx.body = "Ops, something wrong happened: " + err.message;
    }
});

render(app, {
    root: path.join(__dirname, 'views'),
    layout: '',
    viewExt: 'html',
});

router.get('products', '/:products_per_page?/:metafields_per_page?', async (ctx) => {
    const productsPerPage = ctx.params.products_per_page || 10;
    const metafieldsPerPage = ctx.params.metafields_per_page || 10;
    const query = graphqlQuery.bulkProductListQuery(metafieldsPerPage);

      const result = await axios.post(
        "https://haelpl.myshopify.com/admin/api/2021-01/graphql.json",
        query,
        {
            headers: {
                "Content-Type": "application/graphql",
                'Authorization': `Basic ${token}`,
            }
        }
    );
console.log(result.data);

    return ctx.render('index', {
        //products: result.data.data.products.edges,
        products: [],
        productsPerPage: productsPerPage,
        metafieldsPerPage: metafieldsPerPage
    });
});


router.post('products', '/', async (ctx) => {
    const productsPerPage = ctx.request.body.products_per_page || 10;
    const metafieldsPerPage = ctx.request.body.metafields_per_page || 10;
    const query = graphqlQuery.productListQuery(productsPerPage, metafieldsPerPage);

      const result = await axios.post(
        "https://haelpl.myshopify.com/admin/api/2021-01/graphql.json",
        query,
        {
            headers: {
                "Content-Type": "application/graphql",
                'Authorization': `Basic ${token}`,
            }
        }
    );

    let response = {
        productsPerPage: productsPerPage,
        metafieldsPerPage: metafieldsPerPage
    };

    if(result.data.data) {
        response.products = result.data.data.products.edges;
    } else {
        ctx.state.message = result.data.errors[0].message;
        response.products = [];
    }

    return ctx.render('index', response);
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on port ${PORT}`));