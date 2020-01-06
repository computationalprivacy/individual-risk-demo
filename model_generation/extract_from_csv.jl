using Distributions, StatsBase, StatsFuns, GLM, CategoricalArrays, DataFrames
using TerminalMenus, ArgParse
using CSV, CodecZlib, JSON

using CorrectMatch


function extract_parameters(G; trials=1000)
    m = size(G.Σ, 1)

    X = 0.5 .+ 0.5 .* rand(Float64, (trials, m))
    y = Array{Float64}(undef, trials)
        
    for k = 1:trials
        lower = rand(m) .* (1 .- X[k, :])
        upper = lower .+ X[k, :]

        # Convert to gaussian marginals
        lower = norminvcdf.(lower)
        upper = norminvcdf.(upper)

        _, c, _ = CorrectMatch.Copula.call_mvndst(lower, upper, G.Σ.mat)
        y[k] = c
    end

    F = fit(LinearModel, log.(X .+ eps()), log.(y .+ eps()))
    coef(F)
end

function Array{Int}(a::CategoricalArray)
    return map(x -> Int(x), CategoricalArrays.order(a.pool)[a.refs])
end


function encode(df)
    mapcols(c -> Array{Int}(c), df)
end



function main(args)

    # initialize the settings (the description is for the help screen)
    s = ArgParseSettings(description = "Train a copula model and export parameters to a JSON configuration file")
    @add_arg_table s begin
        "--input", "-i"
            help = "Input CSV file"
            required = true
        "--output", "-o"
            default = "output_model.json"
            help = "Output JSON file"
    end
    parsed_args = parse_args(s)
    IN_FILENAME = parsed_args["input"]
    OUT_FILENAME = parsed_args["output"]

    println("Loading the input CSV file  $IN_FILENAME…")
    df = dropmissing(CSV.read(open(IN_FILENAME)))
    menu_options = map(string, names(df))
    menu = MultiSelectMenu(menu_options)
    selected_columns = [Symbol(menu_options[i]) for i in request("Select columns to train the model:", menu)]
    df_sub = df[:, selected_columns]
    data = convert(Matrix, encode(categorical(df_sub)))
    N, M = size(df_sub)

    println("Estimating the model from the selected data…")
    G = fit_mle(GaussianCopula, data)
    coefs = extract_parameters(G)
    marginal_counts = Dict(selected_columns[i] => countmap(df_sub[:, i]; alg=:dict) for i=1:M)
    marginal_fractions = Dict(d_name => Dict(k => v ./ N for (k, v) in d) for (d_name, d) in marginal_counts)
    output = Dict(
        :population_size => N,
        :marginals => marginal_fractions,
        :parameters => Dict(zip(selected_columns, coefs))
    )

    println("Exporting model parameters to $OUT_FILENAME…")
    open(OUT_FILENAME, "w") do f
        write(f, JSON.json(output, 2))
    end
end

main(ARGS)