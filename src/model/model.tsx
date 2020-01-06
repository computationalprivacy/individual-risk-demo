import 'core-js/fn/object/entries'


export function validZIP(marginals: any, userZIP: string) {
    return userZIP in marginals["zipcode"]
}

export function probDrawing(marginals: object, user: object, coefficients: object) {
    const mc = marginals

    let log_p = 0.
    for (const [k, v] of Object.entries(user)) {
        if(mc[k] === undefined) continue
        let m = mc[k][v]
        if (v !== undefined) log_p += coefficients[k] * Math.log(m)
    }

    return Math.exp(log_p)
}

export function uniqueness(marginals: object, user: object, population: number, coefficients: object) {
    let p = probDrawing(marginals, user, coefficients)

    const mc = marginals
    let pop = population
    return (1 - p) ** (pop - 1)
}

export function correctness(marginals: object, user: object, population: number, coefficients: object) {
    let u = uniqueness(marginals, user, population, coefficients)
    let n = population
    return 1 / n * (1 - u ** (n / (n - 1))) / (1 - u ** (1 / (n - 1)))
}