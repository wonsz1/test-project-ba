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
     query: """
      {
        products {
          edges {
            node {
              id
              title
              metafields {
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

function currentBulkOperation() {
  return `{
    currentBulkOperation {
      status
      errorCode
      completedAt
      objectCount
      url
    }
  }`;
}

module.exports = {
  productListQuery: productListQuery,
  bulkProductListQuery: bulkProductListQuery,
  currentBulkOperation: currentBulkOperation
}