import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Modal, FlatList } from "react-native";
import { router } from "expo-router";
import { ChevronDown, Check, X, Search } from "lucide-react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const COUNTRIES = [
  "United States", "Laos", "Thailand", "France", "Australia", "Canada",
  "Vietnam", "China", "Germany", "Other",
];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","Other",
];

const COMMON_CITIES: Record<string, string[]> = {
  Alabama: ["Birmingham","Montgomery","Mobile","Huntsville","Tuscaloosa","Other"],
  Alaska: ["Anchorage","Fairbanks","Juneau","Other"],
  Arizona: ["Phoenix","Tucson","Mesa","Chandler","Glendale","Scottsdale","Other"],
  Arkansas: ["Little Rock","Fort Smith","Fayetteville","Springdale","Other"],
  California: ["Fresno","Sacramento","Merced","San Diego","Los Angeles","San Jose","Oakland","Stockton","Long Beach","San Francisco","Modesto","Bakersfield","Anaheim","Santa Ana","Other"],
  Colorado: ["Denver","Colorado Springs","Aurora","Fort Collins","Lakewood","Boulder","Other"],
  Connecticut: ["Hartford","New Haven","Stamford","Bridgeport","Other"],
  Delaware: ["Wilmington","Dover","Newark","Other"],
  Florida: ["Miami","Orlando","Tampa","Jacksonville","St. Petersburg","Tallahassee","Fort Lauderdale","Other"],
  Georgia: ["Atlanta","Savannah","Augusta","Athens","Macon","Other"],
  Hawaii: ["Honolulu","Hilo","Kailua","Other"],
  Idaho: ["Boise","Meridian","Nampa","Idaho Falls","Other"],
  Illinois: ["Chicago","Aurora","Rockford","Naperville","Springfield","Peoria","Other"],
  Indiana: ["Indianapolis","Fort Wayne","Evansville","South Bend","Lafayette","Other"],
  Iowa: ["Des Moines","Cedar Rapids","Davenport","Sioux City","Iowa City","Other"],
  Kansas: ["Wichita","Overland Park","Kansas City","Topeka","Olathe","Other"],
  Kentucky: ["Louisville","Lexington","Bowling Green","Owensboro","Other"],
  Louisiana: ["New Orleans","Baton Rouge","Shreveport","Lafayette","Other"],
  Maine: ["Portland","Lewiston","Bangor","Other"],
  Maryland: ["Baltimore","Frederick","Rockville","Gaithersburg","Annapolis","Other"],
  Massachusetts: ["Boston","Worcester","Springfield","Cambridge","Lowell","Other"],
  Michigan: ["Detroit","Grand Rapids","Warren","Lansing","Ann Arbor","Other"],
  Minnesota: ["Minneapolis","St. Paul","Little Canada","Brooklyn Park","Bloomington","Rochester","Maplewood","Roseville","Maple Grove","Eagan","Eden Prairie","Coon Rapids","Burnsville","Plymouth","Woodbury","Other"],
  Mississippi: ["Jackson","Gulfport","Biloxi","Hattiesburg","Other"],
  Missouri: ["Kansas City","St. Louis","Springfield","Columbia","Independence","Other"],
  Montana: ["Billings","Missoula","Great Falls","Bozeman","Helena","Other"],
  Nebraska: ["Omaha","Lincoln","Bellevue","Grand Island","Other"],
  Nevada: ["Las Vegas","Henderson","Reno","North Las Vegas","Carson City","Other"],
  "New Hampshire": ["Manchester","Nashua","Concord","Other"],
  "New Jersey": ["Newark","Jersey City","Paterson","Elizabeth","Trenton","Edison","Other"],
  "New Mexico": ["Albuquerque","Las Cruces","Santa Fe","Rio Rancho","Other"],
  "New York": ["New York City","Buffalo","Rochester","Yonkers","Syracuse","Albany","Other"],
  "North Carolina": ["Charlotte","Raleigh","Greensboro","Durham","Winston-Salem","Hickory","Morganton","Asheville","Other"],
  "North Dakota": ["Fargo","Bismarck","Grand Forks","Other"],
  Ohio: ["Columbus","Cleveland","Cincinnati","Toledo","Akron","Dayton","Other"],
  Oklahoma: ["Oklahoma City","Tulsa","Norman","Broken Arrow","Other"],
  Oregon: ["Portland","Salem","Eugene","Gresham","Hillsboro","Bend","Other"],
  Pennsylvania: ["Philadelphia","Pittsburgh","Allentown","Erie","Reading","Lancaster","Other"],
  "Rhode Island": ["Providence","Warwick","Cranston","Other"],
  "South Carolina": ["Columbia","Charleston","North Charleston","Greenville","Spartanburg","Other"],
  "South Dakota": ["Sioux Falls","Rapid City","Aberdeen","Other"],
  Tennessee: ["Nashville","Memphis","Knoxville","Chattanooga","Clarksville","Other"],
  Texas: ["Houston","Dallas","Austin","San Antonio","Fort Worth","El Paso","Arlington","Plano","Other"],
  Utah: ["Salt Lake City","Provo","West Valley City","West Jordan","Orem","Other"],
  Vermont: ["Burlington","Essex","South Burlington","Other"],
  Virginia: ["Virginia Beach","Norfolk","Chesapeake","Richmond","Newport News","Alexandria","Other"],
  Washington: ["Seattle","Spokane","Tacoma","Vancouver","Bellevue","Kent","Everett","Renton","Other"],
  "West Virginia": ["Charleston","Huntington","Morgantown","Other"],
  Wisconsin: ["Milwaukee","Eau Claire","Wausau","Madison","Green Bay","Sheboygan","Appleton","La Crosse","Oshkosh","Other"],
  Wyoming: ["Cheyenne","Casper","Laramie","Other"],
};

type Picker = "country" | "state" | "city" | null;

export default function HometownScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [country, setCountry] = useState<string>(data.hometownCountry ?? "");
  const [state, setState] = useState<string>(data.hometownState ?? "");
  const [city, setCity] = useState<string>(data.hometownCity ?? "");
  const [stateCustom, setStateCustom] = useState<string>("");
  const [cityCustom, setCityCustom] = useState<string>("");
  const [countryCustom, setCountryCustom] = useState<string>("");
  const [picker, setPicker] = useState<Picker>(null);
  const [query, setQuery] = useState<string>("");

  const isUS = country === "United States";
  const stateList = isUS ? US_STATES : [];
  const cityList = useMemo(() => COMMON_CITIES[state] ?? ["Other"], [state]);

  const finalCountry = country === "Other" ? countryCustom.trim() : country;
  const finalState = isUS ? (state === "Other" ? stateCustom.trim() : state) : stateCustom.trim();
  const finalCity = isUS ? (city === "Other" ? cityCustom.trim() : city) : cityCustom.trim();

  const ok = finalCountry.length > 0;

  const onNext = () => {
    update({ hometownCountry: finalCountry, hometownState: finalState, hometownCity: finalCity });
    router.push("/(auth)/orientation");
  };

  const list = picker === "country" ? COUNTRIES : picker === "state" ? stateList : picker === "city" ? cityList : [];
  const filtered = list.filter(x => x.toLowerCase().includes(query.toLowerCase()));

  const onSelect = (v: string) => {
    if (picker === "country") {
      setCountry(v);
      if (v !== "United States") { setState(""); setCity(""); }
    } else if (picker === "state") {
      setState(v);
      setCity("");
    } else if (picker === "city") {
      setCity(v);
    }
    setPicker(null);
    setQuery("");
  };

  return (
    <OnboardingScreen
      step={7}
      total={20}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!ok} variant="light" testID="hometown-next" />}
    >
      <Text style={s.head}>{t("hometownQ")}</Text>
      <Text style={s.sub}>{t("hometownSub")}</Text>

      <Field label="Country" value={country} onPress={() => setPicker("country")} testID="ht-country" />
      {country === "Other" && (
        <TextInput style={s.input} value={countryCustom} onChangeText={setCountryCustom} placeholder="Type your country" placeholderTextColor="rgba(255,255,255,0.35)" />
      )}

      {isUS ? (
        <>
          <Field label="State" value={state} onPress={() => setPicker("state")} testID="ht-state" disabled={!country} />
          {state === "Other" && (
            <TextInput style={s.input} value={stateCustom} onChangeText={setStateCustom} placeholder="Type your state" placeholderTextColor="rgba(255,255,255,0.35)" />
          )}
          <Field label="City" value={city} onPress={() => setPicker("city")} testID="ht-city" disabled={!state} />
          {city === "Other" && (
            <TextInput style={s.input} value={cityCustom} onChangeText={setCityCustom} placeholder="Type your city" placeholderTextColor="rgba(255,255,255,0.35)" />
          )}
        </>
      ) : country && country !== "" ? (
        <>
          <Text style={s.fieldLabel}>State / Region</Text>
          <TextInput style={s.input} value={stateCustom} onChangeText={setStateCustom} placeholder="Your state or region" placeholderTextColor="rgba(255,255,255,0.35)" />
          <Text style={[s.fieldLabel, { marginTop: 12 }]}>City</Text>
          <TextInput style={s.input} value={cityCustom} onChangeText={setCityCustom} placeholder="Your city" placeholderTextColor="rgba(255,255,255,0.35)" />
        </>
      ) : null}

      <Modal visible={picker !== null} animationType="slide" transparent onRequestClose={() => setPicker(null)}>
        <View style={s.modalWrap}>
          <View style={s.modal}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Select {picker}</Text>
              <Pressable onPress={() => setPicker(null)}><X size={22} color={Colors.dark.text} /></Pressable>
            </View>
            <View style={s.searchWrap}>
              <Search size={16} color="rgba(255,255,255,0.5)" />
              <TextInput value={query} onChangeText={setQuery} placeholder="Search…" placeholderTextColor="rgba(255,255,255,0.4)" style={s.searchInput} />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable style={s.row} onPress={() => onSelect(item)} testID={`opt-${item}`}>
                  <Text style={s.rowText}>{item}</Text>
                  {((picker === "country" && country === item) || (picker === "state" && state === item) || (picker === "city" && city === item)) && <Check size={18} color={Colors.crimson} />}
                </Pressable>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </OnboardingScreen>
  );
}

function Field({ label, value, onPress, testID, disabled }: { label: string; value?: string; onPress: () => void; testID?: string; disabled?: boolean }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[s.field, disabled && s.fieldDisabled]} testID={testID}>
      <View style={{ flex: 1 }}>
        <Text style={s.fieldLabel}>{label}</Text>
        <Text style={value ? s.fieldVal : s.fieldPlaceholder}>{value || "Select"}</Text>
      </View>
      <ChevronDown size={18} color="rgba(255,255,255,0.5)" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "700" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20, marginBottom: 18 },
  field: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", marginTop: 10 },
  fieldDisabled: { opacity: 0.5 },
  fieldLabel: { color: Colors.gold, fontSize: 11, fontWeight: "700" as const, letterSpacing: 1.2, textTransform: "uppercase" as const, marginTop: 12 },
  fieldVal: { color: Colors.dark.text, fontSize: 16, fontWeight: "600" as const, marginTop: 4 },
  fieldPlaceholder: { color: "rgba(255,255,255,0.4)", fontSize: 16, marginTop: 4 },
  input: { marginTop: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.crimson, backgroundColor: "rgba(192,21,47,0.08)", color: Colors.dark.text, fontSize: 15 },
  modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  modal: { backgroundColor: Colors.dark.bgSoft, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 30, maxHeight: "85%" },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  modalTitle: { color: Colors.dark.text, fontSize: 17, fontWeight: "700" as const, textTransform: "capitalize" as const },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 18, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  rowText: { color: Colors.dark.text, fontSize: 15 },
});
