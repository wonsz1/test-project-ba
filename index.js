const Koa = require('koa');
const axios = require('axios');
const path = require('path');
const render = require('koa-ejs');
const koaRouter = require('koa-router');
const dotenv = require('dotenv');

dotenv.config();
const app = new Koa();
const router = new koaRouter();

const token = Buffer.from(`${process.env.API_USER}:${process.env.API_PASS}`, 'utf8').toString('base64');

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        console.error(err);
        ctx.body = "Ops, something wrong happened:<br>" + err.message;
    }
});

render(app, {
    root: path.join(__dirname, 'views'),
    layout: '',
    viewExt: 'html',
});

router.get('products', '/', async (ctx) => {

      const result = await axios.post(
        "https://haelpl.myshopify.com/admin/api/2021-01/graphql.json",
        `{
            products(first: 5) {
              edges {
                cursor
                node {
                  id
                  title
                  metafields(first: 30) {
                    edges {
                        node {
                            namespace
                            key
                            value
                        }
                    }
                }
                }
              }
              pageInfo {
                hasNextPage
              }
            }
          }`,
        {
            headers: {
                "Content-Type": "application/graphql",
                'Authorization': `Basic ${token}`,
            }
        }
    );

    return ctx.render('index', {
        products: result.data.data.products.edges,
    });
});

router.get('products-list', '/products-list', async (ctx) => {
    const result = await axios.get("https://haelpl.myshopify.com/admin/api/2021-01/products.json", {
        headers: {
          'Authorization': `Basic ${token}`
        }
      });

    return ctx.render('products-list', {
        products: result.data.products,
    });
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on port ${PORT}`));