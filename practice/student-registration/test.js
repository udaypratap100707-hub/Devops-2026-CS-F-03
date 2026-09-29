const http = require("http");

const PORT = 3000;

console.log("======================================");
console.log("Running Student Portal Tests");
console.log("======================================");


function testHealthAPI() {

    return new Promise((resolve, reject) => {

        const request =
            http.get(
                `http://localhost:${PORT}/api/health`,
                response => {

                    let data = "";

                    response.on(
                        "data",
                        chunk => {
                            data += chunk;
                        }
                    );


                    response.on(
                        "end",
                        () => {

                            if (
                                response.statusCode === 200
                            ) {

                                console.log(
                                    "✓ Health API test passed"
                                );

                                resolve();

                            } else {

                                reject(
                                    new Error(
                                        "Health API failed"
                                    )
                                );

                            }

                        }
                    );

                }
            );


        request.on(
            "error",
            error => {

                reject(error);

            }
        );

    });

}


async function runTests() {

    try {

        await testHealthAPI();

        console.log("");
        console.log(
            "✓ All tests passed successfully"
        );

        process.exit(0);

    } catch (error) {

        console.error("");
        console.error(
            "✗ Test failed:"
        );

        console.error(
            error.message
        );

        process.exit(1);

    }

}


runTests();