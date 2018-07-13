using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Diary.Controllers
{
    public class HomeController : Controller
    {
        IConfiguration _config;

        public HomeController(IConfiguration config)
        {
            _config = config;
        }

        public IActionResult Index()
        {
            ViewBag.UrlPrefix = _config.GetUrlPrefix();
            return View();
        }

        public IActionResult Error()
        {
            ViewBag.UrlPrefix = _config.GetUrlPrefix();
            return View();
        }
    }
}
