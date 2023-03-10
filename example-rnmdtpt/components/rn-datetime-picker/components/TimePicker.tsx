import React, { useEffect, useState, useRef, memo } from "react";
import { View, FlatList, TouchableWithoutFeedback, Text, Image } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import dayjs, { Dayjs } from "dayjs";
import TimeSelectionItem from "./TimeSelectionItem";
//@ts-ignore
import nextFrame from "next-frame";
import LoaderView from "./LoaderView";
import { BlockType, SelectorMode, Unwrap } from "../types";

const empty = { value: "b", type: "empty", disabled: true };

export interface TimePickerProps {
  dateValue: Dayjs | Date;
  minDate?: Date | string | null;
  maxDate?: Date | string | null;
  blocks?: BlockType[];
  onChangeTime: (arg: { timeValue: Date | null | undefined }) => void;
  onDateSelector?: () => void;
  selectorMode?: SelectorMode;
  locale?: string;
}
const TimePicker: React.FC<TimePickerProps> = ({
  dateValue = new Date(),
  minDate,
  maxDate,
  onChangeTime = () => {},
  blocks = [],
  selectorMode,
  onDateSelector,
  locale,
}) => {
  dayjs.locale(locale || "en");

  type ByHourDataType = Unwrap<ReturnType<typeof processByHours>>;
  const blocksToCheck = blocks.filter((block) => block.hasOwnProperty("time"));
  const HoursFlatList = useRef<FlatList>();
  const MinsFlatList = useRef<FlatList>();
  const CycleFlatList = useRef<FlatList>();
  const [hourList, setHourList] = useState<ReturnType<typeof getDataValues>>([]);
  const [minList, setMinList] = useState<ReturnType<typeof getDataValues>>([]);
  const [cycleList, setCycleList] = useState<ReturnType<typeof getDataValues>>([
    { value: "AM", type: "time", disabled: true },
    { value: "PM", type: "time", disabled: true },
  ]);
  const [byHourData, setByHourData] = useState<ByHourDataType>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!byHourData || byHourData.length <= 0) return;
    onChangeCheck();
  }, [dayjs(dateValue).toISOString()]);

  useEffect(() => {
    if (!byHourData || byHourData.length <= 0) return;
    getAllTimeValues();
  }, [byHourData, dayjs(dateValue).hour()]);

  const init = async () => {
    setLoading(true);
    const result = await processByHours(dateValue);
    setByHourData(result);
    setLoading(false);
  };

  const processByHours = async (baseDate: TimePickerProps["dateValue"]) => {
    const byHours = await Promise.all(
      [...Array(24).keys()].map(async (item) => {
        await nextFrame();
        const h = item;
        const checkHour = dayjs(baseDate).hour(h).minute(59).second(0);

        let oneMinEnabled = false;

        const byMinutes = await Promise.all(
          [...Array(60).keys()].map(async (item) => {
            await nextFrame();

            const checkMin = dayjs(checkHour).minute(item).second(0);

            const disabled = generateDisabled(checkMin);

            if (!disabled) oneMinEnabled = true;

            return {
              value: item,
              type: "time",
              disabled: disabled,
            };
          })
        );

        const displayMinutes = byMinutes.map((item) => {
          const minValue = item.value;
          const valueStringFormat = minValue.toString().length == 1 ? "0" + minValue : minValue;

          return {
            ...item,
            value: valueStringFormat,
          };
        });

        return {
          value: h,
          type: "time",
          disabled: oneMinEnabled == false,
          minutes: byMinutes,
          displayMinutes: displayMinutes,
        };
      })
    );

    return byHours;
  };

  const onChangeCheck = () => {
    let selectedTime = dayjs(dateValue);
    const hourData = byHourData[selectedTime.hour()];

    let newTime: Date | dayjs.Dayjs | null = null;
    if (hourData.disabled) {
      newTime = getNearestAvailable("cycle", selectedTime);
    } else if (hourData.minutes[selectedTime.minute()].disabled) {
      newTime = getNearestAvailable("min", selectedTime);
    }

    if (newTime != null) {
      onChangeTime({ timeValue: newTime.toDate() });
      setTimeout(() => {
        newTime && resetTimeToCenter(newTime);
      }, 100);
      return;
    } else {
      setTimeout(() => {
        resetTimeToCenter(selectedTime);
      }, 100);
    }
  };

  const generateDisabled = (baseDate: dayjs.ConfigType | undefined) => {
    const currentDate = dayjs(baseDate);

    if (minDate != null && currentDate.isBefore(minDate, "minute")) {
      return true;
    }

    if (maxDate != null && currentDate.isAfter(maxDate, "minute")) {
      return true;
    }

    for (const block of blocksToCheck) {
      const repeat = block.repeat;

      let timeCheckFrom = dayjs(block?.time?.from);
      let timeCheckTo = dayjs(block?.time?.to);

      let disabled = false;

      const checkValue = dayjs(timeCheckFrom);

      switch (block.type) {
        case "time":
          disabled = true;
          break;
        case "date":
          if (repeat) {
            if (checkValue.locale("en").format("DDMM") == currentDate.locale("en").format("DDMM")) disabled = true;
          } else {
            if (checkValue.isSame(currentDate, "date")) disabled = true;
          }
          break;
        case "week":
          if (currentDate.isSame(checkValue, "week")) {
            disabled = true;
          }
          break;
        case "weekday":
          if (currentDate.locale("en").format("dddd") == checkValue.locale("en").format("dddd")) disabled = true;
          break;
        case "month":
          if (repeat) {
            if (currentDate.locale("en").format("MM") == checkValue.locale("en").format("MM")) disabled = true;
          } else {
            if (currentDate.locale("en").format("MMYYYY") == checkValue.locale("en").format("MMYYYY")) disabled = true;
          }
          break;
        case "year":
          if (currentDate.isSame(checkValue, "year")) disabled = true;
          break;
      }

      if (disabled) {
        timeCheckFrom = timeCheckFrom.year(dayjs(currentDate).year()).dayOfYear(dayjs(currentDate).dayOfYear());
        timeCheckTo = timeCheckTo.year(dayjs(currentDate).year()).dayOfYear(dayjs(currentDate).dayOfYear());

        if (currentDate.isBetween(timeCheckFrom, timeCheckTo, "minute", "[]")) {
          return true;
        }
      }
    }

    return false;
  };

  const getAllTimeValues = () => {
    const [hour, min, cycle] = [getDataValues("hour"), getDataValues("min"), getDataValues("cycle")];

    setHourList([...hour]);
    setMinList([...min]);
    setCycleList([...cycle]);

    onChangeCheck();
  };

  const resetTimeToCenter = (time: TimePickerProps["dateValue"]) => {
    const timeParsed = dayjs(time);

    try {
      const val = parseInt(timeParsed.locale("en").format("h"));
      HoursFlatList?.current?.scrollToIndex({
        index: val == 12 ? 2 : val + 2,
        viewPosition: 0.5,
        animated: true,
      });
      MinsFlatList?.current?.scrollToIndex({
        index: parseInt(timeParsed.locale("en").format("m")) + 2,
        viewPosition: 0.5,
        animated: true,
      });
      CycleFlatList?.current?.scrollToIndex({
        index: timeParsed.locale("en").format("A") == "AM" ? 2 : 3,
        viewPosition: 0.5,
        animated: true,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getNearestAvailable = (type: string, value: Dayjs): Dayjs | null => {
    const givenValue = dayjs(value);
    const currentDate = dayjs(dateValue).hour(givenValue.hour()).minute(givenValue.minute());

    switch (type) {
      case "hour":
        for (let i = 0; i < 24; i++) {
          if (!byHourData[i].disabled) {
            return getNearestAvailable("min", currentDate.hour(i).second(0));
          }
        }

        break;
      case "min":
        const hourSelected = currentDate.hour();

        const byMins = byHourData[hourSelected];
        for (let m = 0; m < 60; m++) {
          const byMinData = byMins.minutes[m];

          if (!byMinData.disabled) {
            return currentDate.hour(hourSelected).minute(byMinData.value).second(0);
          }
        }
        return getNearestAvailable("hour", value);
      case "cycle":
        if (currentDate.locale("en").format("A") == "AM") {
          for (let i = 0; i < 12; i++) {
            if (!byHourData[i].disabled) {
              return getNearestAvailable("min", currentDate.hour(i).minute(0).second(0));
            }
          }
        } else {
          for (let i = 12; i < 24; i++) {
            if (!byHourData[i].disabled) {
              return getNearestAvailable("min", currentDate.hour(i).minute(0).second(0));
            }
          }
        }

        return getNearestAvailable("hour", value);
    }

    return null;
  };

  const onValueSelected = (type: any, value: string | number, index: any) => {
    const selectedTime = dayjs(dateValue);

    let updatedTime = null;

    switch (type) {
      case "hour":
        const A = selectedTime.locale("en").format("A");
        if (A == "AM") {
          updatedTime = dayjs(selectedTime).hour(value == 12 ? 0 : (value as number));
        } else {
          updatedTime = dayjs(selectedTime).hour((value as number) + 12 == 24 ? 12 : (value as number) + 12);
        }
        break;
      case "min":
        updatedTime = dayjs(selectedTime).minute(value as number);
        break;
      case "cycle":
        updatedTime = dayjs(selectedTime);
        if (updatedTime.locale("en").format("A") == value) {
          updatedTime = dayjs(selectedTime);
        } else {
          if (value == "AM") {
            updatedTime = dayjs(selectedTime).subtract(12, "hour");
          } else {
            updatedTime = dayjs(selectedTime).add(12, "hour");
          }
        }

        break;
    }

    updatedTime && resetTimeToCenter(updatedTime);

    onChangeTime({ timeValue: updatedTime != null ? updatedTime.toDate() : updatedTime });
  };

  const isSelected = (type: any, value: any) => {
    switch (type) {
      case "hour":
        return dayjs(dateValue).format("h") == value;
      case "min":
        return dayjs(dateValue).format("mm") == value;
      case "cycle":
        return dayjs(dateValue).locale("en").format("A") == value;
    }
  };

  const getDataValues = (type: string) => {
    let dataValues: { value: string | number; type: string; disabled: boolean }[] = [];

    const _byHourData = [...byHourData];

    switch (type) {
      case "hour":
        dataValues =
          dayjs(dateValue).locale("en").format("A") == "AM"
            ? _byHourData.slice(0, 12).map((item) => {
                return {
                  ...item,
                  value: item.value == 0 ? "12" : item.value,
                };
              })
            : _byHourData.slice(12, 24).map((item) => {
                let newVal = item.value - 12;
                newVal = newVal == 0 ? 12 : newVal;

                return {
                  ...item,
                  value: newVal,
                };
              });
        break;
      case "min":
        dataValues = _byHourData[dayjs(dateValue).hour()].displayMinutes;
        break;
      case "cycle":
        dataValues = ["AM", "PM"].map((item) => {
          const t = item;
          let disabled =
            item == "AM"
              ? _byHourData.slice(0, 12).find((t) => t.disabled == false)
              : _byHourData.slice(12, 24).find((t) => t.disabled == false);

          return {
            value: t,
            type: "time",
            disabled: disabled != null ? false : true,
          };
        });
        break;
    }

    return [empty, empty, ...dataValues, empty, empty];
  };

  const getSelectonList = (type: string) => {
    let refSelector: any;
    let colIndex = 0;
    let listArray: readonly any[] | null | undefined = [];

    switch (type) {
      case "hour":
        refSelector = HoursFlatList;
        colIndex = 1;
        listArray = hourList;
        break;
      case "min":
        refSelector = MinsFlatList;
        colIndex = 2;
        listArray = minList;
        break;
      case "cycle":
        refSelector = CycleFlatList;
        colIndex = 3;
        listArray = cycleList;
        break;
    }

    return (
      <FlatList
        ref={refSelector}
        style={{ marginRight: colIndex % 3 !== 0 ? wp(5) : 0, flex: 1 }}
        showsVerticalScrollIndicator={false}
        listKey={`selection_time_${type}`}
        data={listArray}
        keyExtractor={(item, index) => index.toString()}
        getItemLayout={(data, index) => ({ length: hp(5), offset: hp(5) * index, index })}
        renderItem={({ item, index }) => (
          <TimeSelectionItem
            index={index}
            item={item}
            onValueSelected={onValueSelected}
            type={type}
            isSelected={isSelected(type, item.value)}
          />
        )}
      />
    );
  };

  if (loading) return <LoaderView />;

  return (
    <View style={{ marginTop: hp(3) }}>
      {selectorMode == "datetime" && onDateSelector && (
        <TouchableWithoutFeedback onPress={onDateSelector}>
          <View style={{ marginBottom: hp(2), flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontSize: wp(5),
              }}>
              {dayjs(dateValue).format("DD MMMM YYYY")}
            </Text>
            <Image
              source={require("../assets/icons/calendar-outline.png")}
              style={{ width: wp(5), height: wp(5), marginLeft: wp(1.5) }}
              resizeMode="contain"
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: hp(20),

          backgroundColor: "#f8f8f8",
          borderRadius: 5,
        }}>
        {getSelectonList("hour")}
        {getSelectonList("min")}
        {getSelectonList("cycle")}
      </View>
    </View>
  );
};

export default memo(TimePicker);
