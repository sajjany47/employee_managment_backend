import moment from "moment";

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
