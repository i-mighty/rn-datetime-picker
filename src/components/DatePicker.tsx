import React, { useEffect, useState, memo } from "react";
import { StyleSheet, Text, View, TouchableWithoutFeedback, FlatList } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import dayjs, { Dayjs } from "dayjs";
import DateSelectionItem, { DateSelectionItemProps } from "./DateSelectionItem";
import { Image } from "react-native";
//https://corbt.com/posts/2015/12/22/breaking-up-heavy-processing-in-react-native.html
//@ts-ignore
import nextFrame from "next-frame";
import { BlockType, Mode, SelectorMode } from "../types";

export interface DatePickerProps {
  dateValue: Dayjs | Date;
  fixed?: boolean;
  endMode?: Mode;
  minDate?: Date | string | null;
  maxDate?: Date | string | null;
  blocks?: BlockType[];
  onChangeDate: (arg: { mode: Mode; dateValue: Date | null | undefined }) => void;
  selectorMode?: SelectorMode;
  locale?: string;
  activeColor?: string;
}
export interface ByMonthDataType {
  forYear: number;
  months: {
    value: dayjs.Dayjs;
    type: string;
    disabled: boolean;
    displayDates: (
      | { value: string; type: string }
      | { value: number; type: string; disabled: boolean }
      | { value: dayjs.Dayjs; type: string; disabled: boolean }
    )[];
    dates: { value: dayjs.Dayjs; type: string; disabled: boolean }[];
  }[];
}
const DatePicker: React.FC<DatePickerProps> = ({
  dateValue = dayjs(new Date()),
  endMode = "day",
  fixed = false,
  minDate,
  maxDate,
  onChangeDate = () => {},
  blocks = [],
  locale,
  activeColor,
}) => {
  dayjs.locale(locale || "en");

  const [dateView, setDateView] = useState<Dayjs>(dayjs(dateValue));
  const [mode, setMode] = useState(endMode);
  const [columns, setColumns] = useState(7);
  const [dataShown, setDataShown] = useState<DateSelectionItemProps["item"][]>();
  const [byMonthData, setByMonthData] = useState<ByMonthDataType>();

  const monthsShort = dayjs.monthsShort();
  const weekDaysShort = dayjs.weekdaysMin();

  const weekDaysShortMapped = [...weekDaysShort].map((item) => {
    return {
      value: item,
      type: "header",
    };
  });

  useEffect(() => {
    if (!byMonthData) return;
    onChangeCheck();
    switch (mode) {
      case "day":
      case "week":
        setColumns(7);
        break;
      case "month":
      case "year":
        setColumns(4);
        break;
    }
  }, [mode, dateView, byMonthData, dateValue]);

  useEffect(() => {
    init();
  }, [dayjs(dateView).year()]);

  const init = async () => {
    if (byMonthData != null && byMonthData.forYear == dayjs(dateView).year()) return;

    const result = await processByMonths(dateView);
    setByMonthData(result);
  };

  interface ByMonth {
    forYear: number;
    months: {
      value: dayjs.Dayjs;
      type: string;
      disabled: boolean;
      displayDates: (
        | { value: string; type: string }
        | { value: number; type: string; disabled: boolean }
        | { value: dayjs.Dayjs; type: string; disabled: boolean }
      )[];
      dates: { value: dayjs.Dayjs; type: string; disabled: boolean }[];
    }[];
  }

  const processByMonths = async (
    baseDate: Dayjs | Date
  ): Promise<{
    forYear: number;
    months: {
      value: dayjs.Dayjs;
      type: string;
      disabled: boolean;
      displayDates: (
        | { value: string; type: string }
        | { value: number; type: string; disabled: boolean }
        | { value: dayjs.Dayjs; type: string; disabled: boolean }
      )[];
      dates: { value: dayjs.Dayjs; type: string; disabled: boolean }[];
    }[];
  }> => {
    const byMonths = await Promise.all(
      [...monthsShort].map(async (item, index) => {
        await nextFrame();
        const d = dayjs(baseDate).month(index).startOf("month");

        const startOfMonth = dayjs(d).startOf("month");
        const endOfMonth = dayjs(d).endOf("month");
        const daysInMonth = endOfMonth.diff(startOfMonth, "day") + 1;

        //generate dates
        let oneDateEnabled = false;

        const byDates = await Promise.all(
          Array.from(Array(daysInMonth).keys()).map(async (item) => {
            await nextFrame();

            const d = startOfMonth.add(item, "day");

            const dateDisabled = isDisabled(d, "day");

            if (!dateDisabled) oneDateEnabled = true;

            return {
              value: d,
              type: "date",
              disabled: dateDisabled,
            };
          })
        );

        //add empty spaces for display of month
        const startWeekDay = startOfMonth.format("dd");
        const weekDayStartIndex = weekDaysShort.indexOf(startWeekDay);
        const startEmptySpace = Array.from(Array(weekDayStartIndex).keys()).map((item, index) => {
          return {
            value: item,
            type: "empty",
            disabled: true,
          };
        });
        const endWeekDay = endOfMonth.format("dd");
        const weekDayEndIndex = weekDaysShort.indexOf(endWeekDay);
        const endEmptySpace = Array.from(
          Array(weekDayEndIndex == weekDaysShort.length - 1 ? 0 : weekDaysShort.length - (weekDayEndIndex + 1)).keys()
        ).map((item, index) => {
          return {
            value: item,
            type: "empty",
            disabled: true,
          };
        });

        return {
          value: d,
          type: "date",
          disabled: isDisabled(d, "month") || !oneDateEnabled,
          displayDates: [...weekDaysShortMapped, ...startEmptySpace, ...byDates, ...endEmptySpace],
          dates: byDates,
        };
      })
    );

    return {
      forYear: dayjs(baseDate).year(),
      months: byMonths,
    };
  };

  const onChangeCheck = () => {
    if (isDisabled(dateValue, mode)) {
      const newDate = getNearestAvailable(mode, dateValue);

      if (newDate != null) {
        setDateView(newDate);
        onChangeDate({ mode: mode == endMode ? "final" : mode, dateValue: newDate.toDate() });
        return;
      }
    }

    const data = getDataValues();
    setDataShown(data);
  };

  const getNearestAvailable = (type: Mode, value: Dayjs | Date): Dayjs | null => {
    const givenValue = dayjs(value);

    if (!isDisabled(dayjs(value), type)) {
      return dayjs(value);
    }

    switch (type) {
      case "week":
      case "day":
        for (let i = givenValue.month(); i < 12; i++) {
          const monthData = byMonthData?.months[i];

          if (monthData?.disabled) continue;
          for (let m = givenValue.month() == i ? givenValue.date() : 0; m < givenValue.daysInMonth() - 1; m++) {
            if (!monthData?.dates[m].disabled) {
              return givenValue.month(i).date(m + 1);
            }
          }
        }
        return getNearestAvailable("year", value);
      case "month":
        for (let i = givenValue.month(); i < 12; i++) {
          const monthData = byMonthData?.months[i];
          if (!monthData?.disabled) {
            return getNearestAvailable("year", givenValue.month(i).startOf("month"));
          }
        }
        return getNearestAvailable("year", value);
      case "year":
        for (let i = 0; i < 12; i++) {
          const valueCheck = givenValue.add(i, "year");
          if (!isDisabled(valueCheck, type)) {
            return getNearestAvailable("month", valueCheck.month(0));
          }
        }
        break;
    }
    return null;
  };

  const onModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const onModeFoward = () => {
    let modeFoward: Mode | null = null;
    switch (mode) {
      case "month":
        modeFoward = endMode;
        break;
      case "year":
        modeFoward = "month";
        break;
    }
    if (modeFoward != null) {
      onModeChange(modeFoward);
    }
  };

  const onModeBackward = () => {
    let modeBack: Mode | null = null;
    switch (mode) {
      case "week":
      case "day":
        modeBack = "month";
        break;
      case "month":
        modeBack = "year";
        break;
    }
    if (modeBack != null) {
      onModeChange(modeBack);
      if (modeBack != endMode) {
        onChangeDate({ mode: modeBack, dateValue: null });
      }
    }
  };

  const getTitleInfo = () => {
    let title = null;
    switch (mode) {
      case "week":
      case "day":
        title = dayjs(dateView).format("MMMM YYYY");
        break;
      case "month":
        title = dayjs(dateView).format("YYYY");
        break;
    }

    return title;
  };

  const isDisabled = (dateValue: Date | Dayjs, modeCheck: Mode) => {
    const d = dayjs(dateValue);
    let compareCheck: Mode | "date" = "date";

    switch (modeCheck) {
      case "day":
      case "week":
        compareCheck = "date";
        break;
      case "month":
        compareCheck = "month";
        break;
      case "year":
        compareCheck = "year";
        break;
    }

    if (minDate != null && d.isBefore(dayjs(minDate), compareCheck)) {
      return true;
    }

    if (maxDate != null && d.isAfter(dayjs(maxDate), compareCheck)) {
      return true;
    }

    for (const block of blocks) {
      if (!block.hasOwnProperty("date")) continue;

      const dateCheck = dayjs(block.date);

      const repeat = block.repeat;
      switch (block.type) {
        case "date":
          if (compareCheck == "date") {
            if (repeat) {
              if (d.locale("en").format("DDMM") == dateCheck.locale("en").format("DDMM")) return true;
            } else {
              if (d.isSame(dateCheck, "date")) return true;
            }
          }
          break;
        case "week":
          if (d.isSame(dateCheck, "year") && d.isSame(dateCheck, "week") && compareCheck == "date") return true;
          break;
        case "weekday":
          if (d.locale("en").format("dddd") == dateCheck.locale("en").format("dddd") && compareCheck == "date")
            return true;
          break;
        case "month":
          if (repeat) {
            if (d.locale("en").format("MM") == dateCheck.locale("en").format("MM")) return true;
          } else {
            if (d.locale("en").format("MMYYYY") == dateCheck.locale("en").format("MMYYYY")) return true;
          }
          break;
        case "year":
          if (d.isSame(dateCheck, "year")) return true;
          break;
      }
    }

    return false;
  };

  const getDataValues = () => {
    let dataValues: ByMonthDataType["months"][0]["displayDates"] = [];
    if (byMonthData) {
      switch (mode) {
        case "day":
        case "week":
          dataValues = byMonthData?.months[dayjs(dateView).month()].displayDates;
          break;
        case "month":
          dataValues = byMonthData?.months;
          break;
        case "year":
          let yearStart = dayjs();

          if (dayjs(dateView).isAfter(yearStart, "year")) {
            while (dayjs(dateView).diff(yearStart, "year") >= 11) {
              yearStart = yearStart.add(12, "year");
            }
          } else if (dayjs(dateView).isBefore(yearStart, "year")) {
            let diff = dateView.diff(dayjs(yearStart), "year");

            while (!(diff >= 0 && diff < 12)) {
              yearStart = yearStart.subtract(12, "year");
              diff = dateView.diff(dayjs(yearStart), "year");
            }
          }

          dataValues = Array.from(Array(12).keys()).map((item, index) => {
            const d = dayjs(yearStart).add(index, "year");

            return {
              value: d,
              type: "date",
              disabled: isDisabled(d, mode),
            };
          });
          break;
      }
    }

    return dataValues;
  };

  const isSelected = (date: Dayjs | Date) => {
    const dateParsed = dayjs(date);

    switch (mode) {
      case "day":
        return dateParsed.locale("en").format("DDMMYYYY") == dayjs(dateValue).locale("en").format("DDMMYYYY");
      case "week":
        const startWeek = dayjs(dateValue).startOf("week");
        const endWeek = dayjs(dateValue).endOf("week");
        return (
          dateParsed.isSameOrAfter(startWeek) && dateParsed.isSameOrBefore(endWeek) && !isDisabled(dateParsed, mode)
        );
      case "month":
        return dateParsed.locale("en").format("MMYYYY") == dayjs(dateValue).locale("en").format("MMYYYY");
      case "year":
        return dateParsed.locale("en").format("YYYY") == dayjs(dateValue).locale("en").format("YYYY");
    }
  };

  const onValueSelected = (date: Dayjs | Date | string) => {
    let updatedDate = null;
    switch (mode) {
      case "day":
      case "week":
        updatedDate = dayjs(date);
        break;
      case "month":
        updatedDate = dayjs(dateView).month(dayjs(date).month()).date(1);
        break;
      case "year":
        updatedDate = dayjs(dateView).year(dayjs(date).year()).month(0).date(1);
        break;
    }

    if (!fixed && endMode != mode) {
      onModeFoward();
    }

    updatedDate && setDateView(updatedDate);

    onChangeDate({ mode: mode == endMode ? "final" : mode, dateValue: updatedDate?.toDate() });
  };

  const getDateValueToShow = (date: Dayjs | Date) => {
    const parsedDate = dayjs(date);
    let formattedText = null;
    switch (mode) {
      case "week":
      case "day":
        formattedText = parsedDate.format("D");
        break;
      case "month":
        formattedText = parsedDate.format("MMM");
        break;
      case "year":
        formattedText = parsedDate.format("YYYY");
        break;
    }
    return formattedText;
  };

  const changeSet = (moveState: string) => {
    const currentDateView = dayjs(dateView);
    let updatedView = null;
    const amountToMove = moveState == "next" ? 1 : -1;
    switch (mode) {
      case "week":
      case "day":
        updatedView = currentDateView.add(amountToMove, "month");
        break;
      case "month":
        updatedView = currentDateView.add(amountToMove, "year");
        break;
      case "year":
        updatedView = currentDateView.add(amountToMove * 12, "year");
        break;
    }
    updatedView && setDateView(updatedView);
  };

  // if (loading) return <LoaderView />;

  return (
    <View>
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: hp(2),
        }}>
        <View style={{ flexDirection: "row" }}>
          <TouchableWithoutFeedback onPress={() => changeSet("back")}>
            <View style={{ paddingRight: wp(1.5) }}>
              <Image
                source={require("../assets/icons/chevron-left-outline.png")}
                style={{ width: wp(9), height: wp(9) }}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => changeSet("next")}>
            <View style={{ paddingLeft: wp(1.5) }}>
              <Image
                source={require("../assets/icons/chevron-right-outline.png")}
                style={{ width: wp(9), height: wp(9) }}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
        </View>

        {mode != "year" && !fixed && (
          <TouchableWithoutFeedback onPress={() => onModeBackward()}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: wp(5),
                }}>
                {getTitleInfo()}
              </Text>
              <Image
                source={require("../assets/icons/chevron-down-outline.png")}
                style={{ width: wp(9), height: wp(9) }}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>

      {dataShown != null && (
        <FlatList
          key={columns}
          ItemSeparatorComponent={() => <View style={{ height: hp(1.5) }} />}
          data={dataShown}
          numColumns={columns}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <DateSelectionItem
              activeColor={activeColor}
              index={index}
              item={item}
              columns={columns}
              onValueSelected={onValueSelected}
              isSelected={isSelected(item.value)}
              dateValueToShow={getDateValueToShow(item.value) || ""}
            />
          )}
        />
      )}
    </View>
  );
};

DatePicker.defaultProps = {
  dateValue: dayjs(new Date()),
  endMode: "day",
  fixed: false,
  minDate: null,
  maxDate: null,
  onChangeDate: () => {},
  blocks: [],
};

export default memo(DatePicker);

const styles = StyleSheet.create({});
