import moment from "moment";

export const MonthNameAdd = (startDate, endDate, data) => {
  let currentDate = moment(startDate);
  let monthsList = [];

  while (
    currentDate.isBefore(endDate) ||
    currentDate.isSame(endDate, "month")
  ) {
    monthsList.push(currentDate.format("MMMM,YYYY"));
    currentDate.add(1, "month");
  }

  let finalData = [];
  for (let index = 0; index < monthsList.length; index++) {
    const element = monthsList[index];

    for (let index = 0; index < data.length; index++) {
      const reqData = data[index];

      if (element === reqData._id) {
        finalData.push(reqData);
      } else {
        finalData.push({ _id: element });
      }
    }
  }

  return finalData;
};
