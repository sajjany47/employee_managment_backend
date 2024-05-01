import moment from "moment";
import notify from "../model/notification.model";
import mongoose from "mongoose";
import timeRecord from "../model/timeData.model";
import payroll from "../model/payroll.model";

export const getDateRange = (firstDate: any, lastDate: any) => {
  if (
    moment(firstDate, "YYYY-MM-DD").isSame(
      moment(lastDate, "YYYY-MM-DD"),
      "day"
    )
  ) {
    return lastDate;
  }

  let date = firstDate;

  const dates = [date];

  do {
    date = moment(date).add(1, "day");
    dates.push(date.format("YYYY-MM-DD"));
  } while (moment(date).isBefore(lastDate));

  return dates;
};

export const getWeekendDates = (startDate: any, endDate: any) => {
  const current = moment(startDate);
  const end = moment(endDate);
  const weekendDates = [];
  while (current.isSameOrBefore(end)) {
    if (current.day() !== 6 && current.day() !== 0) {
      weekendDates.push(current.format("YYYY-MM-DD"));
    }
    current.add(1, "day");
  }

  return weekendDates;
};

export const calculateSalary = (
  a: any,
  b: any,
  c: any,
  d: any,
  e: any,
  f: any,
  g: any
) => {
  const salary = Number(a);
  const currentMonthTotalDays = Number(b);
  const present = Number(c);
  const weekendLength = Number(d);
  const absent = Number(e);
  const holiday = Number(f);
  const currentMonthLeave = Number(g);
  const total = (
    (salary / currentMonthTotalDays) *
    (present +
      (currentMonthTotalDays - weekendLength) +
      currentMonthLeave +
      holiday -
      absent)
  ).toFixed(2);

  return Number(total);
};

export const notificationSave = async (
  receiver: any,
  remark: any,
  status: any
) => {
  const newNotification = new notify({
    receiver: receiver,
    date: new Date(),
    remark: remark,
    status: status,
  });

  const saveData = await newNotification.save();

  return saveData;
};

export const generatePayrollMonthly = async (date: any) => {
  const currentMonth = moment(date).format("MM");
  const currentYear = moment(date).format("YYYY");
  const currentMonthYear = moment(date).format("YYYY-MM");

  const findMonth = await timeRecord.aggregate([
    {
      $unwind: {
        path: "$timeSchedule",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        convertDate: {
          $toDate: "$timeSchedule.date",
        },
      },
    },
    {
      $match: {
        $expr: {
          $and: [
            {
              $eq: [{ $year: "$convertDate" }, Number(currentYear)],
            },
            {
              $eq: [{ $month: "$convertDate" }, Number(currentMonth)],
            },
          ],
        },
        "timeSchedule.totalTime": { $ne: null },
      },
    },
    {
      $project: {
        "timeSchedule.date": 1,
        username: 1,
        _id: 0,
      },
    },
    {
      $group: {
        _id: "$username",
        date: {
          $push: {
            date: "$timeSchedule.date",
          },
        },
      },
    },
    {
      $lookup: {
        from: "leavelists",
        localField: "_id",
        foreignField: "user_id",
        as: "leave",
      },
    },
    {
      $unwind: {
        path: "$leave",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $unwind: {
        path: "$leave.leaveDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        "leave.leaveDetail.leaveYear": currentYear,
      },
    },
    {
      $lookup: {
        from: "holidaylists",
        localField: "leave.leaveDetail.leaveYear",
        foreignField: "holidayYear",
        as: "holiday",
      },
    },
    {
      $unwind: {
        path: "$holiday",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "user_salaries",
        localField: "_id",
        foreignField: "username",
        as: "salary",
      },
    },
    {
      $unwind: {
        path: "$salary",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "username",
        as: "bank",
      },
    },
    {
      $unwind: {
        path: "$bank",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        "leave.leaveDetail": 1,
        date: 1,
        "holiday.holidayList": 1,
        "salary.currentSalary": 1,
        "bank.bankDetails": 1,
      },
    },
  ]);

  const currentMonthPayroll: any = [];
  findMonth.forEach((item: any) => {
    const filterLeave = item.leave.leaveDetail.leaveUseDetail.filter(
      (lea: any) => lea.leaveStatus === "approved"
    );

    const convertLeaveLeft = Number(item.leave.leaveDetail.totalLeaveLeft);
    const convertTotalLeave = Number(item.leave.leaveDetail.totalLeave);

    let totalLeave: any = [];
    filterLeave.length > 0 &&
      filterLeave.forEach((element: any) => {
        totalLeave.push(...getWeekendDates(element.startDay, element.endDay));
      });

    let uniqueLeaveArray = [...new Set(totalLeave)];

    let currentLeaveList = [];
    let totalAbsent = 0;
    if (convertLeaveLeft >= 0) {
      const currentMonthLeave = uniqueLeaveArray.filter(
        (a: any) => moment(a).format("YYYY-MM") === currentMonthYear
      );
      currentLeaveList.push(...currentMonthLeave);
      totalAbsent = 0;
    } else {
      const currentMonthLeave = uniqueLeaveArray.filter(
        (a: any) => moment(a).format("YYYY-MM") === currentMonthYear
      );
      const accessLeaveUse = convertTotalLeave - convertLeaveLeft;
      const absent = currentMonthLeave.length - accessLeaveUse;
      if (absent <= 0) {
        totalAbsent = currentMonthLeave.length;
        currentLeaveList.push(...currentMonthLeave);
      }
    }

    const filterHoliday = item.holiday.holidayList.filter(
      (res: any) =>
        moment(res.holidayDate).format("YYYY-MM") === currentMonthYear
    );
    const currentMontTotalDays = moment(
      currentMonthYear,
      "YYYY-MM"
    ).daysInMonth();
    const monthYear = currentMonthYear;
    const totalWeekHoliday: any = getWeekendDates(
      moment(`${monthYear}-01`, "YYYY-MM-DD"),
      moment(`${monthYear}-${currentMontTotalDays}`, "YYYY-MM-DD")
    );

    const a = item?.salary.currentSalary;
    const b = currentMontTotalDays;
    const c = item.date.length;
    const d = totalWeekHoliday.length;
    const e = totalAbsent;
    const f = filterHoliday.length;
    const g = currentLeaveList.length;
    let userSalary: any = {
      basicSalary: calculateSalary(a.basicSalary, b, c, d, e, f, g),
      hra: calculateSalary(a.hra, b, c, d, e, f, g),
      travelAllowance: calculateSalary(a.travelAllowance, b, c, d, e, f, g),
      MedicalAllowance: calculateSalary(a.MedicalAllowance, b, c, d, e, f, g),
      LeaveTravelAllowance: calculateSalary(
        a.LeaveTravelAllowance,
        b,
        c,
        d,
        e,
        f,
        g
      ),
      SpecialAllowance: calculateSalary(a.SpecialAllowance, b, c, d, e, f, g),
      providentFund: calculateSalary(a.providentFund, b, c, d, e, f, g),
      incomeTax: calculateSalary(a.incomeTax, b, c, d, e, f, g),
      professionalTax: a.professionalTax,
      healthInsurance: a.healthInsurance,
      ctc: a.ctc,
    };

    userSalary.totalEarning =
      userSalary.basicSalary +
      userSalary.hra +
      userSalary.travelAllowance +
      userSalary.MedicalAllowance +
      userSalary.LeaveTravelAllowance +
      userSalary.SpecialAllowance -
      userSalary.providentFund -
      userSalary.incomeTax -
      userSalary.professionalTax -
      userSalary.healthInsurance;

    currentMonthPayroll.push({
      username: item._id,
      date: currentMonthYear,
      present: item.date.length,
      currentMonthTotalLeave: currentLeaveList.length,
      absent: totalAbsent,
      currentMonthTotalHoliday: filterHoliday.length,
      totalMonthDays: currentMontTotalDays,
      totalWeekend: currentMontTotalDays - totalWeekHoliday.length,
      salaryStatus: "pending",
      transactionNumber: null,
      transactionDate: null,
      accountNumber: item.bank.bankDetails.accountNumber,
      bankName: item.bank.bankDetails.bankName,
      ifsc: item.bank.bankDetails.ifsc,
      branchName: item.bank.bankDetails.branchName,
      currentMonthSalary: userSalary,
    });
  });

  const monthPayrollAdd = new payroll({
    date: currentMonthYear,
    userPayroll: currentMonthPayroll,
  });

  const saveMonthPayroll = await monthPayrollAdd.save();

  return saveMonthPayroll;
};
