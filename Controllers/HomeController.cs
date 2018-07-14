using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Diary.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace Diary.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index() => View();

        public IActionResult Error() => View();
    }
}
