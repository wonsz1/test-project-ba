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

function bulkProductListQuery(metafieldsPerPage) {
  return `mutation {
    bulkOperationRunQuery(
      query:"""
      {
        products() {
          edges {
            node {
              id
              title
            }
          }
        }
      }
      """
    ) {
      bulkOperation {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }`;
}

module.exports = {
  productListQuery: productListQuery,
  bulkProductListQuery: bulkProductListQuery
}