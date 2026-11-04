import {

  useMemo,

  useState,

} from "react";



import {

  useNavigate,

} from "react-router-dom";



import {

  Factory,

  Store,

  Users,

  Warehouse,

  Wheat,

  ShieldCheck,

  FileText,

} from "lucide-react";



import Breadcrumbs from "../../../Components/Minor-Components/Breadcrumbs";

import DateDisplay from "../../../Components/Minor-Components/DateDisplay";

import DashboardExportControls from "../../../Components/Minor-Components/DashboardExportControls";

import Toast from "../../../Components/Modals/Toast";

import useToast from "../../../Components/hooks/useToast";

import {

  downloadCsv,

  generateDashboardPdf,

  formatReportDate,

  formatReportTime,

} from "../../../lib/dashboardExportUtils";



import KPICard from "../../../Components/Graphs/KPICard";

import DistributionCard from "../../../Components/Graphs/PieChartCard";

import BarGraphsCard from "../../../Components/Graphs/BarGraphsCard";

import RecentActivityCard from "../../../Components/Graphs/RecentActivityCard";



import useAdminDashboard from "../../../Components/hooks/AccountAdmin/useAdminDashboard";





// ============================================================

// CONSTANTS

// ============================================================



const ROLE_CONFIG = {

  miller_manager: {

    label: "Miller Manager",

    activityLabel: "Miller",

    icon: Factory,

  },



  warehouse_manager: {

    label: "Warehouse Manager",

    activityLabel: "Warehouse Manager",

    icon: Warehouse,

  },



  retailer: {

    label: "Retailer",

    activityLabel: "Retailer",

    icon: Store,

  },



  farmer: {

    label: "Farmer",

    activityLabel: "Farmer",

    icon: Wheat,

  },

};





// ============================================================

// HELPERS

// ============================================================



const formatLastUpdated = (

  value

) => {

  if (!value) {

    return "Loading...";

  }





  const date =

    new Date(

      value

    );





  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return "Recently";

  }





  const now =

    new Date();





  const sameDay =

    now.getFullYear() ===

      date.getFullYear() &&

    now.getMonth() ===

      date.getMonth() &&

    now.getDate() ===

      date.getDate();





  const time =

    date.toLocaleTimeString(

      "en-PH",

      {

        hour:

          "numeric",



        minute:

          "2-digit",

      }

    );





  if (

    sameDay

  ) {

    return `Today · ${time}`;

  }





  const dateText =

    date.toLocaleDateString(

      "en-PH",

      {

        month:

          "short",



        day:

          "numeric",



        year:

          "numeric",

      }

    );





  return `${dateText} · ${time}`;

};





const formatRelativeTime = (

  value

) => {

  if (!value) {

    return "Recently";

  }





  const date =

    new Date(

      value

    );





  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return "Recently";

  }





  const difference =

    Date.now() -

    date.getTime();





  if (

    difference < 0

  ) {

    return "Just now";

  }





  const minute =

    60 * 1000;



  const hour =

    60 * minute;



  const day =

    24 * hour;



  const week =

    7 * day;





  if (

    difference <

    minute

  ) {

    return "Just now";

  }





  if (

    difference <

    hour

  ) {

    const minutes =

      Math.floor(

        difference /

        minute

      );



    return `${minutes} ${

      minutes === 1

        ? "min"

        : "mins"

    } ago`;

  }





  if (

    difference <

    day

  ) {

    const hours =

      Math.floor(

        difference /

        hour

      );



    return `${hours} ${

      hours === 1

        ? "hour"

        : "hours"

    } ago`;

  }





  if (

    difference <

    week

  ) {

    const days =

      Math.floor(

        difference /

        day

      );



    return `${days} ${

      days === 1

        ? "day"

        : "days"

    } ago`;

  }





  return date.toLocaleDateString(

    "en-PH",

    {

      month:

        "short",



      day:

        "numeric",



      year:

        "numeric",

    }

  );

};





const getFullName = (

  activity

) => {

  const value =

    String(

      activity

        ?.full_name ||

      ""

    ).trim();





  return (

    value ||

    activity?.email ||

    "A GrainRise user"

  );

};





// ============================================================

// ADMIN DASHBOARD

// ============================================================



export default function AdminDashboard() {

  const navigate =

    useNavigate();





  // =========================================================

  // API

  // =========================================================



  const {

    kpis,



    overallUsers,

    accountStatus,



    entityBreakdown,

    roleStatusBreakdown,



    recentActivity,



    fetchedAt,



    isLoading,

    isRefreshing,

    error,

    refreshDashboard,

  } = useAdminDashboard();



  const { toasts, showToast, removeToast } = useToast();



  const csvDatasets = useMemo(

    () => [

      { id: "kpi", label: "KPI & User Summary", icon: Users },

      { id: "account_status", label: "Account Status Breakdown", icon: ShieldCheck },

      { id: "entities", label: "Entity Distribution", icon: Factory },

      { id: "role_status", label: "Role Status Matrix", icon: Warehouse },

      { id: "recent_activity", label: "Recent User Activity", icon: FileText },

    ],

    []

  );



  const handleRefresh = async () => {

    try {

      await refreshDashboard();

      showToast({

        type: "success",

        title: "Dashboard Refreshed",

        message: "Admin dashboard data has been updated.",

      });

    } catch {

      showToast({

        type: "error",

        title: "Refresh Failed",

        message: "Unable to refresh admin dashboard data.",

      });

    }

  };



  const handleExportCsv = (section = "all") => {

    try {

      const rows = [];

      const dateStr = new Date().toISOString().split("T")[0];

      const filename = `grainrise-admin-dashboard-${section}-${dateStr}.csv`;



      rows.push(["GRAINRISE PLATFORM ADMINISTRATION DASHBOARD REPORT"]);

      rows.push(["Generated At", `${formatReportDate()} ${formatReportTime()}`]);

      rows.push(["Total Registered Users", overallUsers]);

      rows.push([]);



      if (section === "kpi" || section === "all") {

        rows.push(["KEY USER METRICS"]);

        rows.push(["Metric", "Count", "Description"]);

        rows.push(["Miller Managers", kpis?.miller_managers || 0, "Registered Miller accounts"]);

        rows.push(["Warehouse Managers", kpis?.warehouse_managers || 0, "Registered Warehouse accounts"]);

        rows.push(["Retailers", kpis?.retailers || 0, "Registered Retailer accounts"]);

        rows.push(["Farmers", kpis?.farmers || 0, "Registered Farmer accounts"]);

        rows.push(["Overall Users", overallUsers, "Total registered accounts across all roles"]);

        rows.push([]);

      }



      if (section === "account_status" || section === "all") {

        rows.push(["ACCOUNT STATUS BREAKDOWN"]);

        rows.push(["Status", "Count"]);

        rows.push(["Active", accountStatus?.active || 0]);

        rows.push(["To Review", accountStatus?.to_review || 0]);

        rows.push(["Archived", accountStatus?.archived || 0]);

        rows.push(["Deactivated", accountStatus?.deactivated || 0]);

        rows.push([]);

      }



      if (section === "entities" || section === "all") {

        rows.push(["ENTITY BREAKDOWN"]);

        rows.push(["Entity Role", "User Count", "Share (%)"]);

        (entityBreakdown || []).forEach((e) => {

          rows.push([e.label, e.count, `${e.percentage}%`]);

        });

        rows.push([]);

      }



      if (section === "role_status" || section === "all") {

        rows.push(["ROLE STATUS MATRIX"]);

        rows.push(["Role", "Active", "To Review", "Archived", "Deactivated"]);

        (roleStatusBreakdown || []).forEach((r) => {

          rows.push([r.role, r.active, r.to_review, r.archived, r.deactivated]);

        });

        rows.push([]);

      }



      if (section === "recent_activity" || section === "all") {

        rows.push(["RECENT USER ACTIVITY"]);

        rows.push(["User", "Email", "Role", "Action", "Timestamp"]);

        (recentActivity || []).forEach((a) => {

          rows.push([

            getFullName(a),

            a.email || "—",

            a.role || "—",

            a.action || a.title || "—",

            a.created_at || a.date || "—",

          ]);

        });

        rows.push([]);

      }



      downloadCsv(filename, rows);

      showToast({

        type: "success",

        title: "Report Exported",

        message: "Admin CSV report downloaded successfully.",

      });

    } catch (err) {

      console.error("Admin CSV export error:", err);

      showToast({

        type: "error",

        title: "Export Failed",

        message: "Failed to export CSV. Please try again.",

      });

    }

  };



  const handleExportPdf = () => {

    try {

      generateDashboardPdf({

        title: "GRAINRISE AGRICULTURAL PLATFORM",

        subtitle: "Executive System Administration & User Ecosystem Report",

        metadata: [

          { label: "Administrator", value: "System Admin" },

          { label: "Overall Registered Accounts", value: String(overallUsers) },

        ],

        kpis: [

          { title: "MILLER MANAGERS", value: kpis?.miller_managers || 0 },

          { title: "WAREHOUSES", value: kpis?.warehouse_managers || 0 },

          { title: "RETAILERS", value: kpis?.retailers || 0 },

          { title: "FARMERS", value: kpis?.farmers || 0 },

        ],

        sections: [

          {

            title: "Account Status Overview",

            type: "table",

            headers: ["Status Category", "Account Count"],

            colWidths: [90, 92],

            rows: [

              ["Active Accounts", accountStatus?.active || 0],

              ["Pending Review", accountStatus?.to_review || 0],

              ["Archived Accounts", accountStatus?.archived || 0],

              ["Deactivated Accounts", accountStatus?.deactivated || 0],

            ],

          },

          {

            title: "Entity Breakdown by Role",

            type: "table",

            headers: ["Entity", "User Count", "Ecosystem Share"],

            colWidths: [62, 60, 60],

            rows: (entityBreakdown || []).map((e) => [e.label, e.count, `${e.percentage}%`]),

          },

          {

            title: "Recent User Activity Log",

            type: "table",

            headers: ["User Name / Email", "Role", "Activity Description", "Date / Time"],

            colWidths: [55, 35, 52, 40],

            rows: (recentActivity || []).slice(0, 15).map((a) => [

              getFullName(a),

              a.role || "—",

              a.action || a.title || "—",

              formatRelativeTime(a.created_at || a.date),

            ]),

          },

        ],

        filename: `grainrise-admin-report-${new Date().toISOString().split("T")[0]}.pdf`,

      });

      showToast({

        type: "success",

        title: "Report Exported",

        message: "Admin summary PDF report downloaded successfully.",

      });

    } catch (err) {

      console.error("PDF export error:", err);

      showToast({

        type: "error",

        title: "Export Failed",

        message: "Failed to generate PDF. Please try again.",

      });

    }

  };





  // =========================================================

  // CLICKABLE KPI CARDS

  // =========================================================



  const metrics =

    useMemo(

      () => [

        {

          title:

            "Miller Managers",



          value:

            isLoading

              ? "—"

              : String(

                  kpis

                    ?.miller_managers ||

                  0

                ),



          footer:

            "Registered Miller Accounts",



          icon: (

            <Factory

              size={18}

              strokeWidth={2.2}

            />

          ),



          tone:

            "success",



          path:

            "/admin/suppliers",

        },





        {

          title:

            "Warehouses",



          value:

            isLoading

              ? "—"

              : String(

                  kpis

                    ?.warehouse_managers ||

                  0

                ),



          footer:

            "Registered Warehouses",



          icon: (

            <Warehouse

              size={18}

              strokeWidth={2.2}

            />

          ),



          tone:

            "success",



          path:

            "/admin/warehouses",

        },





        {

          title:

            "Retailers",



          value:

            isLoading

              ? "—"

              : String(

                  kpis

                    ?.retailers ||

                  0

                ),



          footer:

            "Registered Retailer Accounts",



          icon: (

            <Store

              size={18}

              strokeWidth={2.2}

            />

          ),



          tone:

            "neutral",



          path:

            "/admin/retailers",

        },

      ],

      [

        isLoading,

        kpis,

      ]

    );





  // =========================================================

  // ENTITY BREAKDOWN

  // =========================================================



  const distributionItems =

    useMemo(

      () => {

        const colorMap = {

          miller_manager:

            "#0B7A2A",



          warehouse_manager:

            "#51A447",



          retailer:

            "#8BCF75",



          farmer:

            "#CFF3D1",

        };





        return (

          Array.isArray(

            entityBreakdown

          )

            ? entityBreakdown

            : []

        ).map(

          (

            item

          ) => ({

            label:

              item?.label ||

              ROLE_CONFIG[

                item?.key

              ]?.label ||

              "User",



            value:

              Number(

                item?.value ||

                0

              ),



            color:

              colorMap[

                item?.key

              ] ||

              "#E6F9E9",

          })

        );

      },

      [

        entityBreakdown,

      ]

    );





  // =========================================================

  // ACCOUNT STATUS GRAPH

  // =========================================================



  const accountStatusItems =

    useMemo(

      () => [

        {

          label:

            "Active",



          value:

            Number(

              accountStatus

                ?.active ||

              0

            ),

        },



        {

          label:

            "To Review",



          value:

            Number(

              accountStatus

                ?.to_review ||

              0

            ),

        },



        {

          label:

            "Archived",



          value:

            Number(

              accountStatus

                ?.archived ||

              0

            ),

        },



        {

          label:

            "Deactivated",



          value:

            Number(

              accountStatus

                ?.deactivated ||

              0

            ),

        },

      ],

      [

        accountStatus,

      ]

    );





  // =========================================================

  // TO REVIEW BY ROLE GRAPH

  // =========================================================



  const reviewByRoleItems =

    useMemo(

      () => {

        const roleOrder = [

          "miller_manager",

          "warehouse_manager",

          "retailer",

          "farmer",

        ];





        const roleMap =

          new Map(

            (

              Array.isArray(

                roleStatusBreakdown

              )

                ? roleStatusBreakdown

                : []

            ).map(

              (

                item

              ) => [

                item?.user_role,

                item,

              ]

            )

          );





        return roleOrder.map(

          (

            role

          ) => {

            const item =

              roleMap.get(

                role

              );





            return {

              label:

                role ===

                "miller_manager"

                  ? "Millers"

                  : role ===

                    "warehouse_manager"

                    ? "Warehouses"

                    : role ===

                      "retailer"

                      ? "Retailers"

                      : "Farmers",



              value:

                Number(

                  item

                    ?.to_review ||

                  0

                ),

            };

          }

        );

      },

      [

        roleStatusBreakdown,

      ]

    );





  // =========================================================

  // RECENT ACTIVITY

  // =========================================================



  const recentActivityItems =

    useMemo(

      () => {

        return (

          Array.isArray(

            recentActivity

          )

            ? recentActivity

            : []

        ).map(

          (

            activity

          ) => {

            const config =

              ROLE_CONFIG[

                activity

                  ?.user_role

              ] ||

              {

                activityLabel:

                  "User",



                icon:

                  Users,

              };





            const ActivityIcon =

              config.icon;





            return {

              id:

                activity

                  ?.user_id,



              title:

                `New ${config.activityLabel} Registered`,



              description:

                `${getFullName(

                  activity

                )} registered in GrainRise`,



              time:

                formatRelativeTime(

                  activity

                    ?.created_at

                ),



              icon:

                ActivityIcon,



              color:

                "#0B7A2A",

            };

          }

        );

      },

      [

        recentActivity,

      ]

    );





  // =========================================================

  // ENTITY TOTAL LABEL

  // =========================================================



  const totalLabel =

    isLoading

      ? "—"

      : String(

          overallUsers ||

          0

        );





  // =========================================================

  // RENDER

  // =========================================================



  return (

    <div

      className="

        space-y-6

      "

    >

      {/* =====================================================

          HEADER

      ===================================================== */}



      <div

        className="

          flex

          items-start

          justify-between

          gap-4

        "

      >

        <div>

          <Breadcrumbs

            items={[

              {

                label:

                  "Main",

              },



              {

                label:

                  "Dashboard",

              },

            ]}

          />





          <h1

            className="

              text-2xl

              font-bold

              text-gray-900

              sm:text-3xl

            "

          >

            Dashboard

          </h1>





          <p

            className="

              mt-1

              text-sm

              text-slate-500

            "

          >

            Last Updated:{" "}



            {

              formatLastUpdated(

                fetchedAt

              )

            }

          </p>

        </div>





        <DashboardExportControls

          formattedDate={fetchedAt ? formatReportDate(fetchedAt) : undefined}

          onRefresh={handleRefresh}

          isRefreshing={isRefreshing}

          refreshTitle="Refresh Admin Dashboard Data"

          csvDatasets={csvDatasets}

          onExportCsv={handleExportCsv}

          onExportPdf={handleExportPdf}

        />

      </div>





      {/* =====================================================

          API ERROR

      ===================================================== */}



      {

        error &&

        !isLoading && (

          <div

            className="

              rounded-xl

              border

              border-red-200

              bg-red-50

              px-4

              py-3

            "

          >

            <p

              className="

                text-sm

                font-semibold

                text-red-700

              "

            >

              Unable to load dashboard data.

            </p>



            <p

              className="

                mt-1

                text-xs

                text-red-600

              "

            >

              {error}

            </p>

          </div>

        )

      }





      {/* =====================================================

          KPI CARDS

      ===================================================== */}



      <div

        className="

          grid

          gap-4

          md:grid-cols-3

          xl:grid-cols-3

        "

      >

        {

          metrics.map(

            (

              metric

            ) => (

              <button

                key={

                  metric.title

                }

                type="button"

                onClick={() =>

                  navigate(

                    metric.path

                  )

                }

                className="

                  block

                  w-full

                  rounded-xl

                  text-left

                  transition

                  duration-200

                  hover:-translate-y-0.5

                  hover:shadow-md

                  focus:outline-none

                  focus:ring-2

                  focus:ring-emerald-500

                  focus:ring-offset-2

                "

                aria-label={`Open ${metric.title}`}

              >

                <div

                  className="

                    pointer-events-none

                  "

                >

                  <KPICard

                    title={

                      metric.title

                    }

                    value={

                      metric.value

                    }

                    footer={

                      metric.footer

                    }

                    icon={

                      metric.icon

                    }

                    tone={

                      metric.tone

                    }

                  />

                </div>

              </button>

            )

          )

        }

      </div>





      {/* =====================================================

          MAIN ANALYTICS

      ===================================================== */}



      <div

        className="

          grid

          gap-6

          lg:grid-cols-3

        "

      >

        {/* ===================================================

            ENTITY BREAKDOWN

        =================================================== */}



        <div

          className="

            lg:col-span-2

          "

        >

          <DistributionCard

            title="Entity Breakdown"

            items={

              distributionItems

            }

            totalLabel={

              totalLabel

            }

            className="h-full"

          />

        </div>





        {/* ===================================================

            RIGHT-SIDE GRAPHS

        =================================================== */}



        <div

          className="

            grid

            gap-6

          "

        >

          <BarGraphsCard

            title="Account Status Overview"

            items={

              accountStatusItems

            }

            seriesLabel="Accounts"

            className="h-full"

          />





          <BarGraphsCard

            title="Applications To Review"

            items={

              reviewByRoleItems

            }

            seriesLabel="Pending"

            className="h-full"

          />

        </div>

      </div>





      {/* =====================================================

          RECENT ACTIVITY

      ===================================================== */}



      {

        isLoading ? (

          <div

            className="

              flex

              min-h-[180px]

              items-center

              justify-center

              rounded-xl

              border

              border-slate-200

              bg-white

            "

          >

            <div

              className="

                text-center

              "

            >

              <div

                className="

                  mx-auto

                  mb-3

                  h-7

                  w-7

                  animate-spin

                  rounded-full

                  border-4

                  border-gray-200

                  border-t-[#08511f]

                "

              />



              <p

                className="

                  text-sm

                  font-semibold

                  text-gray-600

                "

              >

                Loading recent activity...

              </p>

            </div>

          </div>

        ) : recentActivityItems.length >

          0 ? (

          <RecentActivityCard

            title="Recent Activity"

            items={

              recentActivityItems

            }

          />

        ) : (

          <div

            className="

              rounded-xl

              border

              border-slate-200

              bg-white

              px-6

              py-8

              text-center

            "

          >

            <Users

              size={28}

              className="

                mx-auto

                text-gray-300

              "

            />



            <p

              className="

                mt-3

                text-sm

                font-semibold

                text-gray-600

              "

            >

              No recent activity yet.

            </p>



            <p

              className="

                mt-1

                text-xs

                text-gray-400

              "

            >

              New GrainRise account registrations will appear here.

            </p>

          </div>

        )

      }



      <Toast toasts={toasts} removeToast={removeToast} />

    </div>

  );

}