import { Dayjs } from "dayjs";
import React, { memo } from "react";
import { StyleSheet, Text, View, TouchableWithoutFeedback } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

export interface DateSelectionItemProps {
  index: number;
  isSelected?: boolean;
  dateValueToShow: string;
  columns: number;
  item: {
    type: "header" | "date" | string;
    disabled?: boolean;
    value: any;
  };
  onValueSelected: (value: string) => void;
  activeColor?: string;
}

const DateSelectionItem: React.FC<DateSelectionItemProps> = ({
  index,
  item,
  columns,
  onValueSelected,
  isSelected,
  dateValueToShow,
  activeColor,
}) => {
  return (
    <View style={{ marginLeft: index % columns !== 0 ? wp(3) : 0, flex: 1 }}>
      {index < 7 && item.type == "header" ? (
        <View style={[styles.BlockCard]}>
          <Text
            style={{
              color: "grey",
              fontSize: wp(4),
              // fontFamily: "roboto-regular"
            }}>
            {item.value}
          </Text>
        </View>
      ) : (
        <TouchableWithoutFeedback
          disabled={item.type != "date" || item.disabled}
          onPress={() => onValueSelected(item.value)}>
          <View
            style={[
              styles.DateItemCard,
              {
                backgroundColor: isSelected ? activeColor || "#F34E5C" : undefined,
                opacity: item.type == "date" ? 1 : 0,
              },
            ]}>
            <Text
              style={item.disabled ? styles.DisabledText : isSelected ? styles.SelectedText : styles.NormalTextDate}>
              {dateValueToShow}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default memo(DateSelectionItem);

const styles = StyleSheet.create({
  BlockCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  DateItemCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(2),
    paddingVertical: hp(1),
    // aspectRatio: 1,
    borderRadius: 5,
  },
  NormalTextDate: {
    fontSize: wp(4),
    // fontFamily: "roboto-regular",
    color: "black",
    textAlign: "center",
  },
  SelectedText: {
    fontSize: wp(4),
    // fontFamily: "roboto-bold",
    color: "white",
    textAlign: "center",
  },
  DisabledText: {
    fontSize: wp(4),
    // fontFamily: "roboto-regular",
    color: "#ddd",
    textAlign: "center",
  },
});
