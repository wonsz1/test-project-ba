function productListQuery(productsPerPage, metafieldsPerPage) {
    return `{
        products(first: ${productsPerPage}) {
          edges {
            cursor
            node {
              id
              title
              metafields(first: ${metafieldsPerPage}) {
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
      }`;
}

module.exports = {
  productListQuery: productListQuery
}