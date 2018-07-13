using Microsoft.Extensions.Configuration;

public static class ConfigurationExtensions
{
    public static string GetUrlPrefix(this IConfiguration config) => string.IsNullOrEmpty(config["url_path_prefix"]) ? "" : "/" + config["url_path_prefix"];
}
