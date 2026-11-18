"""Simulated narrative content (English + Arabic) shared by the source PDFs, the signals feed and the board pack."""

# Arabic text for business fields: id -> (location, relationship, description)
BUSINESS_AR = {
    "zand": ("دبي، الإمارات", "تمثيل في مجلس الإدارة",
             "بنك للاقتصاد الرقمي مرخّص من مصرف الإمارات العربية المتحدة المركزي في 2022: خدمات مصرفية للشركات، وحسابات الضمان، وحفظ الأصول الرقمية المنظّم."),
    "index-exchange": ("الإمارات", "ملكية مشتركة مع مجموعة التنمية العالمية",
                       "تحويل الأموال وصرف العملات والمدفوعات عبر الحدود وخدمات الرواتب عبر نظام حماية الأجور منذ 1976."),
    "aip": ("الإمارات", "استحواذ في 2021", "إدارة الأصول والثروات، والاستثمارات البديلة، والاستشارات في تمويل الشركات."),
    "samaa": ("الإمارات", "شركة تابعة للمجموعة", "جهة تمويل غير مصرفية للتمويل المضمون بالأصول والعقارات وسلاسل الإمداد."),
    "sama-egypt": ("مصر", "مساهم منذ 2017", "التأجير التمويلي للمركبات والمعدات والآلات والعقارات التجارية."),
    "transguard": ("الإمارات", "مشروع مشترك مع مجموعة الإمارات",
                   "الأمن، ودعم الطيران، وإدارة المرافق، والخدمات النقدية، والقوى العاملة، والخدمات اللوجستية."),
    "atd": ("الإمارات ومصر", "شركة تابعة للمجموعة",
            "تقنيات غرف احتراق التوربينات الغازية، وإعادة تأهيل المحطات، وتصنيع المكونات وصيانتها (ATD Combustors وATD Egypt)."),
    "dalma": ("أبوظبي، الإمارات", "عبر شركة المطورون", "وجهة للتسوق والترفيه في أبوظبي."),
    "cbre": ("دبي وأبوظبي", "حصة في الشركات التشغيلية في الإمارات",
             "التقييم والاستشارات والتأجير وإدارة العقارات (CBRE Dubai LLC وCBRE Emirates)."),
    "developers": ("أبوظبي، الإمارات", "عضو في التحالف المالك",
                   "شركة قابضة للتطوير والاستثمار العقاري يملكها تحالف من بيوت الأعمال في أبوظبي."),
    "re-investments": ("دبي وأبوظبي", "ملكية مباشرة",
                       "عقارات مملوكة مباشرة: المبنيان 5 و6 في إعمار سكوير، وفلل في معسكر آل نهيان، وعقار تجاري في مصفح."),
    "infra": ("أبوظبي والعين", "ملكية مباشرة",
              "مدن صناعية وطرق ومرافق ومعالجة مياه الصرف: آيكاد 2 و3، ومدينة العين الصناعية، وآيكادين."),
}

# Management commentary per (business, quarter): (English, Arabic)
COMMENTARY = {
    ("atd", "2026-Q2"): ("EBITDA was below budget as the ATD Egypt plant rehabilitation contract slipped by one quarter; "
                         "fixed workshop costs were carried without the planned revenue. Management expects recovery in Q3.",
                         "جاءت الأرباح قبل الفوائد والضرائب والإهلاك دون الميزانية بعد تأخر عقد إعادة تأهيل محطة ATD في مصر ربعًا واحدًا، "
                         "مع تحمّل تكاليف الورش الثابتة دون الإيرادات المخطط لها. تتوقع الإدارة التعافي في الربع الثالث."),
    ("atd", "2026-Q3"): ("EBITDA missed budget for a second consecutive quarter. The Egypt plant rehabilitation contract start "
                         "has moved to Q1 2027 pending client financing. Order backlog is 12% below plan. Management proposes "
                         "re-phasing the FY budget and redeploying two engineering teams to UAE overhaul work.",
                         "جاءت الأرباح قبل الفوائد والضرائب والإهلاك دون الميزانية للربع الثاني على التوالي. تأجّل بدء عقد إعادة تأهيل "
                         "المحطة في مصر إلى الربع الأول 2027 بانتظار تمويل العميل. سجل الطلبيات أقل من الخطة بنسبة 12%. تقترح الإدارة "
                         "إعادة جدولة الميزانية السنوية ونقل فريقين هندسيين إلى أعمال الصيانة في الإمارات."),
    ("samaa", "2026-Q2"): ("Asset quality broadly stable; NPL ratio 3.9% vs 3.5% budget driven by two trading-sector accounts.",
                           "جودة الأصول مستقرة إجمالًا؛ نسبة القروض المتعثرة 3.9% مقابل 3.5% في الميزانية بسبب حسابين في قطاع التجارة."),
    ("samaa", "2026-Q3"): ("Impairment charges rose as the NPL ratio increased to 4.6% against a 3.5% budget. Borrower SAMAA-C-017 "
                           "(construction, AED 48.0m outstanding) breached its DSCR covenant (1.05 vs 1.20 minimum) and is 35 days "
                           "past due. A standstill and restructuring proposal is under review; additional collateral requested. "
                           "Construction-sector exposure is being capped at 25% of the book.",
                           "ارتفعت مخصصات انخفاض القيمة مع صعود نسبة القروض المتعثرة إلى 4.6% مقابل 3.5% في الميزانية. أخلّ المقترض "
                           "SAMAA-C-017 (قطاع البناء، 48.0 مليون درهم قائمة) بتعهد نسبة تغطية خدمة الدين (1.05 مقابل حد أدنى 1.20) وهو "
                           "متأخر 35 يومًا. يجري النظر في مقترح لتجميد المطالبات وإعادة الهيكلة مع طلب ضمانات إضافية. سيُحدّ التعرض لقطاع "
                           "البناء عند 25% من المحفظة."),
    ("sama-egypt", "2026-Q3"): ("Lease portfolio grew in local currency, but currency translation reduced the AED value of the "
                                "portfolio. Carrying value for the group fell from AED 312m to AED 289m, reflecting FX translation and "
                                "higher provisions.",
                                "نمت محفظة التأجير بالعملة المحلية، لكن تحويل العملات خفّض قيمتها بالدرهم. انخفضت القيمة الدفترية للمجموعة "
                                "من 312 إلى 289 مليون درهم بسبب تحويل العملات وارتفاع المخصصات."),
    ("transguard", "2026-Q3"): ("Revenue in line with budget. Workforce onboarding programme expanded; headcount stable. "
                                "Cash services volumes steady; new facilities contracts mobilised.",
                                "الإيرادات متوافقة مع الميزانية. توسّع برنامج تهيئة الموظفين الجدد مع استقرار عدد الموظفين. أحجام الخدمات "
                                "النقدية مستقرة، وبدأ تنفيذ عقود جديدة لإدارة المرافق."),
    ("dalma", "2026-Q3"): ("Footfall ahead of budget for the third consecutive quarter; occupancy 95%. Two anchor-store renewals completed.",
                           "أعداد الزوار فوق الميزانية للربع الثالث على التوالي؛ ونسبة الإشغال 95%. اكتمل تجديد عقدين لمتاجر رئيسية."),
    ("re-investments", "2026-Q3"): ("Two Emaar Square Building 5 tenants have leases expiring in Q1 2027; renewal negotiations are "
                                    "under way. Occupancy remains above 89%.",
                                    "عقدا إيجار لمستأجرَين في المبنى 5 بإعمار سكوير ينتهيان في الربع الأول 2027، والمفاوضات جارية. "
                                    "تبقى نسبة الإشغال فوق 89%."),
    ("zand", "2026-Q3"): ("Customer deposits continued to grow ahead of plan; digital-asset custody volumes increased.",
                          "استمر نمو ودائع العملاء متقدمًا على الخطة، وارتفعت أحجام حفظ الأصول الرقمية."),
    ("infra", "2026-Q3"): ("Three new ICAD II plot leases signed in the quarter. ICADIN wastewater plant utilisation stable.",
                           "توقيع ثلاثة عقود إيجار جديدة لقطع أراضٍ في آيكاد 2 خلال الربع. استقرار معدل تشغيل محطة آيكادين لمعالجة مياه الصرف."),
    ("index-exchange", "2026-Q3"): ("Transfer volumes in line with plan. Compliance programme for new payment-services reporting "
                                    "requirements is in progress.",
                                    "أحجام التحويل متوافقة مع الخطة. برنامج الامتثال لمتطلبات تقارير خدمات الدفع الجديدة قيد التنفيذ."),
}
DEFAULT_COMMENTARY = ("Performance in line with plan; no material issues to report.",
                      "الأداء متوافق مع الخطة؛ لا توجد مسائل جوهرية للإبلاغ عنها.")


def commentary(business_id: str, period: str) -> tuple[str, str]:
    return COMMENTARY.get((business_id, period), DEFAULT_COMMENTARY)


# Group Risk Committee, Q3 2026: items discussed and actions agreed
RISK_ITEMS = [
    {"business": "samaa", "severity": "alert",
     "risk": "DSCR covenant breach by borrower SAMAA-C-017 (AED 48.0m) and rise in NPL ratio to 4.6%.",
     "risk_ar": "إخلال المقترض SAMAA-C-017 بتعهد نسبة تغطية خدمة الدين (48.0 مليون درهم) وارتفاع نسبة القروض المتعثرة إلى 4.6%.",
     "action": "SAMAA management to present a restructuring plan and collateral position by the next meeting.",
     "action_ar": "تقدّم إدارة سماء للتمويل خطة لإعادة الهيكلة وموقف الضمانات بحلول الاجتماع القادم.",
     "owner": "SAMAA Finance management", "owner_ar": "إدارة سماء للتمويل"},
    {"business": "atd", "severity": "watch",
     "risk": "EBITDA below budget for two consecutive quarters due to the Egypt plant rehabilitation delay.",
     "risk_ar": "جاءت الأرباح قبل الفوائد والضرائب والإهلاك دون الميزانية لربعين متتاليين بسبب تأخر إعادة تأهيل المحطة في مصر.",
     "action": "ATD to submit a re-phased FY budget and mitigation plan.",
     "action_ar": "تقدّم ATD ميزانية سنوية معاد جدولتها وخطة للتخفيف.",
     "owner": "ATD management", "owner_ar": "إدارة ATD"},
    {"business": "sama-egypt", "severity": "watch",
     "risk": "Egypt exposure: group carrying value in Egypt (SAMA Finance and ATD Egypt) declined in Q3 on FX translation and provisions.",
     "risk_ar": "التعرض في مصر: انخفضت القيمة الدفترية للمجموعة في مصر (سما للتمويل وATD مصر) في الربع الثالث بسبب تحويل العملات والمخصصات.",
     "action": "Group Finance to report Egypt exposure quarterly with sensitivity to further currency moves.",
     "action_ar": "تقدّم الإدارة المالية للمجموعة تقريرًا ربع سنوي عن التعرض في مصر مع تحليل الحساسية لتحركات العملة.",
     "owner": "Group Finance", "owner_ar": "الإدارة المالية للمجموعة"},
    {"business": "re-investments", "severity": "info",
     "risk": "Lease expiries at Emaar Square Building 5 in Q1 2027.",
     "risk_ar": "انتهاء عقود إيجار في المبنى 5 بإعمار سكوير في الربع الأول 2027.",
     "action": "Renewals in negotiation; report status next quarter.",
     "action_ar": "مفاوضات التجديد جارية؛ يُرفع التقرير في الربع القادم.",
     "owner": "Real estate team", "owner_ar": "فريق العقارات"},
]
