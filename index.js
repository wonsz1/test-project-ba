const Koa = require('koa');
const axios = require('axios');
const path = require('path');
const render = require('koa-ejs');
const koaRouter = require('koa-router');
const dotenv = require('dotenv');
const koaBody = require('koa-body');
const graphqlQuery = require('./helpers/graphql_query');
const readline = require('readline');

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

router.get('products', '/', async (ctx) => {
    let currentBulkOperation = await callBulkOperation(graphqlQuery.currentBulkOperation());

    if(((Date.now() - Date.parse(currentBulkOperation.data.data.currentBulkOperation.completedAt))/ 60000) > 1) {
        //refresh query
        await callBulkOperation(graphqlQuery.bulkProductListQuery());
    }

    currentBulkOperation = await checkStatus();

    let products = await readFile(currentBulkOperation);

    return ctx.render('index', {
        products: products
    });
});

/**
 * wait till bulk operation status is competed, with 2s interval checks
 */
async function checkStatus() {
    let currentBulkOperation = await callBulkOperation(graphqlQuery.currentBulkOperation());
    if(currentBulkOperation.data.data.currentBulkOperation.status !== "COMPLETED") {
        await new Promise(resolve => {
            setTimeout(resolve, 2000)
        });

        return checkStatus();
    } 

    return currentBulkOperation;
}

/**
 * call GraphQL
 * @param {*} query 
 */
function callBulkOperation(query) {
    return axios.post(
        "https://haelpl.myshopify.com/admin/api/2021-01/graphql.json",
        query,
        {
            headers: {
                "Content-Type": "application/graphql",
                'Authorization': `Basic ${token}`,
            }
        }
    );
}

/**
 * read file from shopify api line by line
 * metafields are in separate lines, after each products, so they can be add to last product in array
 * 
 * @param {*} currentBulkOperation 
 */
async function readFile(currentBulkOperation) {
    const resultDataFile = await axios.get(currentBulkOperation.data.data.currentBulkOperation.url, {responseType: 'stream'});
    
    const rl = readline.createInterface({
        input: resultDataFile.data,
        crlfDelay: Infinity
    });

    let products = [];
    let tmp = {};

    for await (const line of rl) {
        // Each line will be successively available here as `line`.
        tmp = JSON.parse(line);
        //check if current line is product or metafield
        if(typeof tmp.title !== 'undefined') {
            tmp['metafield'] = [];
            products.push(tmp); 
        } else {
            products[products.length - 1]['metafield'].push(tmp);
        }
    }
    return products;
}

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on port ${PORT}`));