import moment from "moment";

export const salarySlipTemplate = (data: any) => {
  const template = `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Index page</title>
 <style>
    .salary-slip {
        margin: 15px;
      }
      .salary-slip .empDetail {
        width: 100%;
        text-align: left;
        border: 2px solid black;
        border-collapse: collapse;
        table-layout: fixed;
      
       
      }
      
      .salary-slip .head {
        margin: 10px;
        margin-bottom: 50px;
        width: 100%;
      }
      .salary-slip .companyName {
        text-align: right;
        font-size: 25px;
        font-weight: bold;
      }
      .salary-slip .salaryMonth {
        text-align: center;
      }
      .salary-slip .table-border-bottom {
        border-bottom: 1px solid;
      }
      .salary-slip .table-border-right {
        border-right: 1px solid;
      }
      .salary-slip .myBackground {
       
        /* padding-top: 10px; */
        text-align: left;
        border: 1px solid black;
        height: 40px;
       
      }
      .salary-slip .myAlign {
        text-align: center;
        border-right: 1px solid black;
      }
      .salary-slip .myTotalBackground {
        padding-top: 10px;
        text-align: left;
        background-color: #EBF1DE;
        border-spacing: 0px;
      }
      .salary-slip .align-4 {
        width: 25%;
        float: left;
      }
      .salary-slip .tail {
        margin-top: 35px;
      }
      .salary-slip .align-2 {
        margin-top: 25px;
        width: 50%;
        float: left;
      }
      .salary-slip .border-center {
        text-align: center;
      }
      .salary-slip .border-center th, .salary-slip .border-center td {
        border: 1px solid black;
      }
      .salary-slip th, .salary-slip td {
        padding-left: 6px;
      }
      </style>
  </head>
    
    <body class="salary-slip">
   
    <table class="empDetail">
        <tr>
          <th>Name</th>
          <td>${data.userInfo.name}</td>
          <td></td>
          <th>Bank Name</th>
          <td>${data.userPayroll.bankName}</td>
          <td></td>
          <th>Period</th>
          <td>${moment(data.userPayroll.date).format("MMM,YYYY")}</td>
        </tr>

        <tr>
          <th>Employee Code</th>
          <td>${data.userPayroll.username}</td>
          <td></td>
          <th>Bank A/C no.</th>
          <td>${data.userPayroll.accountNumber}</td>
          <td></td>
          <th>Present</th>
          <td>
            ${
              data.userPayroll.present +
              data.userPayroll.totalWeekend +
              data.userPayroll.currentMonthTotalHoliday +
              data.userPayroll.currentMonthTotalLeave -
              data.userPayroll.absent
            }
          </td>
        </tr>
        <tr>
          <th>Position</th>
          <td>${data.userInfo.position}</td>
          <td></td>
          <th>Bank Branch</th>
          <td>${data.userPayroll.branchName}</td>
          <td></td>
          <th>Days</th>
          <td>${data.userPayroll.totalMonthDays}</td>
        </tr>
        <tr>
          <th>Mobile</th>
          <td>${data.userInfo.mobile}</td>
          <td></td>
          <th>IFSC</th>
          <td>${data.userPayroll.ifsc}</td>
          <td></td>
          <th>Absent</th>
          <td>${data.userPayroll.absent}</td>
        </tr>
        <tr>
          <th>DOB</th>
          <td>${moment(data.userInfo.dob).format("DD MMM, YYYY")}</td>
          <td></td>
          <th>PAN No:</th>
          <td>${data.userInfo.document.panNumber}</td>
          <td></td>
          <th>Leave</th>
          <td>${data.userPayroll.currentMonthTotalLeave}</td>
        </tr>
        <tr>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
        </tr>
        <tr>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
        </tr>

        <tr class="myBackground">
          <th colspan='2'>Payments</th>
          <th>CTC</th>
          <th class="table-border-right">Amount (Rs.)</th>
          <th colspan='2'>Deductions</th>
          <th>CTC</th>
          <th>Amount (Rs.)</th>
        </tr>
        <tr>
          <th colspan='2'>Basic Salary</th>
          <td>${data.salaryInfo.currentSalary.basicSalary}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.basicSalary}
          </td>
          <th colspan='2'>Provident Fund</th>
          <td>${data.salaryInfo.currentSalary.providentFund}</td>

          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.providentFund}
          </td>
        </tr>
        <tr>
          <th colspan='2'>HRA</th>
          <td>${data.salaryInfo.currentSalary.hra}</td>

          <td class="myAlign">${data.userPayroll.currentMonthSalary.hra}</td>
          <th colspan='2'>Health Insurance</th>
          <td>${data.salaryInfo.currentSalary.healthInsurance}</td>

          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.healthInsurance}
          </td>
        </tr>
        <tr>
          <th colspan='2'>Travel Allowance</th>
          <td>${data.salaryInfo.currentSalary.travelAllowance}</td>

          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.travelAllowance}
          </td>
          <th colspan='2'>Professional Tax</th>
          <td>${data.salaryInfo.currentSalary.professionalTax}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.professionalTax}
          </td>
        </tr>
        <tr>
          <th colspan='2'>Medical Allowance</th>
          <td>${data.salaryInfo.currentSalary.MedicalAllowance}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.MedicalAllowance}
          </td>
          <th colspan='2'>Income Tax</th>
          <td>${data.salaryInfo.currentSalary.incomeTax}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.incomeTax}
          </td>
        </tr>
        <tr>
          <th colspan='2'>LeaveTravel Allowance</th>
          <td>${data.salaryInfo.currentSalary.LeaveTravelAllowance}</td>

          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.LeaveTravelAllowance}
          </td>
          <th colspan='2'></th>
          <td></td>
          <td class="myAlign"></td>
        </tr>
        <tr>
          <th colspan='2'>Special Allowance</th>
          <td>${data.salaryInfo.currentSalary.SpecialAllowance}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.SpecialAllowance}
          </td>
          <th colspan='2'></th>
          <td></td>
          <td class="myAlign"></td>
        </tr>
        <tr>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
        </tr>
        <tr>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
        </tr>

        <tr class="myBackground ">
          <th colspan='2'></th>
          <th></th>

          <td></td>
          <td></td>
          <td></td>
          <td class="table-border-right"></td>
          <th class="table-border-bottom col-span-2">Net Salary</th>
          <td>INR ${data.userPayroll.currentMonthSalary.totalEarning}</td>
        </tr>
      
    </table>
   
    </body>
    </html>`;

  return template;
};

export const registerTemplate = (data: any) => {
  const template = `
  <!doctype html>
  <html lang="en-US">
  
  <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <title>New Account Email Template</title>
      <meta name="description" content="New Account Email Template.">
      <style type="text/css">
          a:hover {text-decoration: underline !important;}
      </style>
  </head>
  
  <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
      <!-- 100% body table -->
      <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
          style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
          <tr>
              <td>
                  <table style="background-color: #f2f3f8; max-width:670px; margin:0 auto;" width="100%" border="0"
                      align="center" cellpadding="0" cellspacing="0">
                      <tr>
                          <td style="height:80px;">&nbsp;</td>
                      </tr>
                                         <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td>
                              <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                  style="max-width:670px; background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                  <tr>
                                      <td style="height:40px;">&nbsp;</td>
                                  </tr>
                                  <tr>
                                      <td style="padding:0 35px;">
                                          <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">GROW2TECH
                                          </h1>
                                          <p style="font-size:15px; color:#455056; margin:8px 0 0; line-height:24px;">
                                              Your account has been successfully created . Below are your system generated credentials, <br><strong>Please change
                                                  the password immediately after login</strong>.</p>
                                          <span
                                              style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                          <p
                                              style="color:#455056; font-size:18px;line-height:20px; margin:0; font-weight: 500;">
                                              <strong
                                                  style="display: block;font-size: 13px; margin: 0 0 4px; color:rgba(0,0,0,.64); font-weight:normal;">Username</strong>${data.username}
                                              <strong
                                                  style="display: block; font-size: 13px; margin: 24px 0 4px 0; font-weight:normal; color:rgba(0,0,0,.64);">Password</strong>${data.password}
                                          </p>
  
                                          <a href="login.html"
                                              style="background:#20e277;text-decoration:none !important; display:inline-block; font-weight:500; margin-top:24px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Login
                                              to your Account</a>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="height:40px;">&nbsp;</td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td style="text-align:center;">
                              <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>www.grow2tech.com</strong> </p>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:80px;">&nbsp;</td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
      <!--/100% body table-->
  </body>
  
  </html>`;

  return template;
};
