import React, { useState, useEffect, memo } from "react";
import { View, StyleSheet } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import DatePicker, { DatePickerProps } from "./DatePicker";
import TimePicker, { TimePickerProps } from "./TimePicker";
import dayjs, { Dayjs } from "dayjs";
import { SelectorMode, Mode } from "../types";
import Button from "./Button";

export interface DateTimePickerProps {
  dateValue?: Date | Dayjs;
  onClose?: () => void;
  onConfirm?: (date: Dayjs | Date) => void;
  onFinalChange?: (date: Dayjs) => void;
  selectorMode?: SelectorMode;
  confirmText?: string;
  cancelText?: string;
  endMode?: Mode;
  renderConfirmButton?: (onPress: () => void) => React.ReactNode;
  renderCancelButton?: (onPress: () => void) => React.ReactNode;
  locale?: string;
  activeColor?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = (props) => {
  const {
    dateValue,
    onClose,
    onConfirm,
    onFinalChange,
    selectorMode,
    confirmText,
    cancelText,
    renderConfirmButton,
    renderCancelButton,
    locale,
  } = props;

  const [showConfirm, setShowConfirm] = useState(true);
  const [dateTimeSelected, setDateTimeSelected] = useState(dateValue || dayjs());
  const [showTime, setShowTime] = useState(false);

  useEffect(() => {
    dayjs.locale(locale || "en");
    setDateTimeSelected(dayjs(dateValue));
  }, [dateValue, locale]);

  const onDateChange: DatePickerProps["onChangeDate"] = ({ mode, dateValue }) => {
    if (dateValue != null && (mode == "final" || mode == "month")) {
      setShowConfirm(true);
      const newSelected = dayjs(dateValue);

      const updateSelected = dayjs(dateTimeSelected).year(newSelected.year()).dayOfYear(newSelected.dayOfYear());

      setDateTimeSelected(updateSelected);
      onFinalChange && onFinalChange(updateSelected);
    } else {
      setShowConfirm(false);
    }
  };

  const onTimeChange: TimePickerProps["onChangeTime"] = ({ timeValue }) => {
    if (timeValue != null) {
      const newSelected = dayjs(timeValue);
      const updateSelected = dayjs(dateTimeSelected).hour(newSelected.hour()).minute(newSelected.minute());

      setDateTimeSelected(updateSelected);
    }
  };

  const onConfirmSelection = () => {
    if (selectorMode == "datetime" && !showTime) {
      setShowTime(true);
      setShowConfirm(false);

      setTimeout(() => {
        setShowConfirm(true);
      }, 100);

      return;
    }

    onConfirm && onConfirm(dateTimeSelected);
  };

  const onDateSelector = () => {
    if (selectorMode == "datetime" && showTime) {
      setShowTime(false);
      setShowConfirm(false);

      setTimeout(() => {
        setShowConfirm(true);
      }, 100);
    }
  };

  const isDatePickerVisble = () => {
    if (selectorMode == "datetime" && !showTime) {
      return true;
    } else if (selectorMode?.includes("date") && selectorMode != "datetime") {
      return true;
    }

    return false;
  };

  const isTimePickerVisible = () => {
    if (showTime && selectorMode == "datetime") {
      return true;
    } else if (selectorMode?.includes("time") && selectorMode != "datetime") {
      return true;
    }

    return false;
  };

  return (
    <View>
      <View style={styles.InnerContentWrapper}>
        {isDatePickerVisble() && <DatePicker {...props} dateValue={dateTimeSelected} onChangeDate={onDateChange} />}

        {isTimePickerVisible() && (
          <TimePicker
            {...props}
            onDateSelector={onDateSelector}
            dateValue={dateTimeSelected}
            onChangeTime={onTimeChange}
          />
        )}
      </View>
      <View style={styles.ButtonButtonWrapper}>
        {showConfirm && (
          <>
            {renderConfirmButton ? (
              renderConfirmButton(onConfirmSelection)
            ) : (
              <Button disabled={!showConfirm} onPress={onConfirmSelection}>
                {confirmText || "Confirm"}
              </Button>
            )}
          </>
        )}

        {renderCancelButton ? (
          renderCancelButton(onClose ? onClose : () => {})
        ) : (
          <Button wrapperStyle={{ marginTop: hp(1), borderWidth: 0 }} onPress={onClose} textStyle={{ color: "grey" }}>
            {cancelText || "Cancel"}
          </Button>
        )}
      </View>
    </View>
  );
};

DateTimePicker.defaultProps = {
  dateValue: dayjs(),
  onClose: () => {},
  onConfirm: () => {},
  onFinalChange: () => {},
  selectorMode: "datetime",
};

export default memo(DateTimePicker);

const styles = StyleSheet.create({
  InnerContentWrapper: {
    paddingTop: hp(3),
    paddingHorizontal: wp(5),
  },
  ButtonButtonWrapper: {
    marginTop: hp(5),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  SuccessButton: {
    backgroundColor: "rgba(1,1,1,0)",
  },
});
