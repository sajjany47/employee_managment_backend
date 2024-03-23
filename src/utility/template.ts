import moment from "moment";

export const salarySlipTemplate = (data: any) => {
  const template = `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Index page</title>
 
  </head>
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
    <body>
    <div class="salary-slip">
    <Table class="empDetail">
      <TableBody>
        <TableRow>
          <th>Name</th>
          <td>${data.userInfo.name}</td>
          <td></td>
          <th>Bank Name</th>
          <td>${data.userPayroll.bankName}</td>
          <td></td>
          <th>Period</th>
          <td>${moment(data.userPayroll.date).format("MMM,YYYY")}</td>
        </TableRow>

        <TableRow>
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
        </TableRow>
        <TableRow>
          <th>Position</th>
          <td>${data.userInfo.position}</td>
          <td></td>
          <th>Bank Branch</th>
          <td>${data.userPayroll.branchName}</td>
          <td></td>
          <th>Days</th>
          <td>${data.userPayroll.totalMonthDays}</td>
        </TableRow>
        <TableRow>
          <th>Mobile</th>
          <td>${data.userInfo.mobile}</td>
          <td></td>
          <th>IFSC</th>
          <td>${data.userPayroll.ifsc}</td>
          <td></td>
          <th>Absent</th>
          <td>${data.userPayroll.absent}</td>
        </TableRow>
        <TableRow>
          <th>DOB</th>
          <td>${moment(data.userInfo.dob).format("DD MMM, YYYY")}</td>
          <td></td>
          <th>PAN No:</th>
          <td>${data.userInfo.document.panNumber}</td>
          <td></td>
          <th>Leave</th>
          <td>${data.userPayroll.currentMonthTotalLeave}</td>
        </TableRow>
        <TableRow>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
        </TableRow>
        <TableRow>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
        </TableRow>

        <TableRow class="myBackground">
          <th class="col-span-2">Payments</th>
          <th>CTC</th>
          <th class="table-border-right">Amount (Rs.)</th>
          <th class="col-span-2">Deductions</th>
          <th>CTC</th>
          <th>Amount (Rs.)</th>
        </TableRow>
        <TableRow>
          <th class="col-span-2">Basic Salary</th>
          <td>${data.salaryInfo.currentSalary.basicSalary}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.basicSalary}
          </td>
          <th class="col-span-2">Provident Fund</th>
          <td>${data.salaryInfo.currentSalary.providentFund}</td>

          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.providentFund}
          </td>
        </TableRow>
        <TableRow>
          <th class="col-span-2">HRA</th>
          <td>${data.salaryInfo.currentSalary.hra}</td>

          <td class="myAlign">${data.userPayroll.currentMonthSalary.hra}</td>
          <th class="col-span-2">Health Insurance</th>
          <td>${data.salaryInfo.currentSalary.healthInsurance}</td>

          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.healthInsurance}
          </td>
        </TableRow>
        <TableRow>
          <th class="col-span-2">Travel Allowance</th>
          <td>${data.salaryInfo.currentSalary.travelAllowance}</td>

          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.travelAllowance}
          </td>
          <th class="col-span-2">Professional Tax</th>
          <td>${data.salaryInfo.currentSalary.professionalTax}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.professionalTax}
          </td>
        </TableRow>
        <TableRow>
          <th class="col-span-2">Medical Allowance</th>
          <td>${data.salaryInfo.currentSalary.MedicalAllowance}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.MedicalAllowance}
          </td>
          <th class="col-span-2">Income Tax</th>
          <td>${data.salaryInfo.currentSalary.incomeTax}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.incomeTax}
          </td>
        </TableRow>
        <TableRow>
          <th class="col-span-2">LeaveTravel Allowance</th>
          <td>${data.salaryInfo.currentSalary.LeaveTravelAllowance}</td>

          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.LeaveTravelAllowance}
          </td>
          <th class="col-span-2"></th>
          <td></td>
          <td class="myAlign"></td>
        </TableRow>
        <TableRow>
          <th class="col-span-2">Special Allowance</th>
          <td>${data.salaryInfo.currentSalary.SpecialAllowance}</td>
          <td class="myAlign">
            ${data.userPayroll.currentMonthSalary.SpecialAllowance}
          </td>
          <th class="col-span-2"></th>
          <td></td>
          <td class="myAlign"></td>
        </TableRow>
        <TableRow>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
        </TableRow>
        <TableRow>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
          <td></td>
          <th></th>
          <td></td>
        </TableRow>

        <TableRow class="myBackground ">
          <th class="col-span-2"></th>
          <th></th>

          <td></td>
          <td></td>
          <td></td>
          <td class="table-border-right"></td>
          <th class="table-border-bottom col-span-2">Net Salary</th>
          <td>INR ${data.userPayroll.currentMonthSalary.totalEarning}</td>
        </TableRow>
      </TableBody>
    </Table>
    </div>
    </body>
    </html>`;

  return template;
};
