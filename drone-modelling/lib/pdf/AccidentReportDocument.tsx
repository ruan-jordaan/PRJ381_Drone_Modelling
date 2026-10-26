import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

type ReportParty = {
  name: string;
  vehicleRegistration: string | null;
  contactDetails: string | null;
  insurer: {
    name: string;
    email: string;
  } | null;
};

type ReportMeasurement = {
  label: string;
  distanceMeters: number;
};

type AccidentReportDocumentProps = {
  caseId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  parties: ReportParty[];
  measurements: ReportMeasurement[];
  narrative: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#222",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 9,
    color: "#666",
    marginBottom: 24,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },

  label: {
    fontWeight: "bold",
  },

  text: {
    marginBottom: 4,
    lineHeight: 1.4,
  },

  partyCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },

  table: {
    borderWidth: 1,
    borderColor: "#ddd",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    padding: 7,
    fontWeight: "bold",
  },

  tableRow: {
    flexDirection: "row",
    padding: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  measurementName: {
    width: "70%",
  },

  measurementDistance: {
    width: "30%",
    textAlign: "right",
  },

  narrativeBox: {
    borderWidth: 1,
    borderColor: "#bbb",
    backgroundColor: "#f7f7f7",
    padding: 12,
  },

  aiLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 6,
  },

  narrativeText: {
    lineHeight: 1.5,
  },

  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#777",
    textAlign: "center",
  },
});

export default function AccidentReportDocument({
  caseId,
  title,
  description,
  createdAt,
  parties,
  measurements,
  narrative,
}: AccidentReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Accident Reconstruction Report
        </Text>

        <Text style={styles.subtitle}>
          Case ID: {caseId}
        </Text>

        {/* Case Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Case Details
          </Text>

          <Text style={styles.text}>
            <Text style={styles.label}>Title: </Text>
            {title}
          </Text>

          <Text style={styles.text}>
            <Text style={styles.label}>
              Date Created:{" "}
            </Text>
            {createdAt.toLocaleDateString()}
          </Text>

          <Text style={styles.text}>
            <Text style={styles.label}>
              Description:{" "}
            </Text>
            {description || "No description provided."}
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Parties Involved
          </Text>

          {parties.map((party, index) => (
            <View
              key={index}
              style={styles.partyCard}
              wrap={false}
            >
              <Text style={styles.text}>
                <Text style={styles.label}>
                  Party {index + 1}:{" "}
                </Text>
                {party.name}
              </Text>

              {party.vehicleRegistration && (
                <Text style={styles.text}>
                  <Text style={styles.label}>
                    Vehicle Registration:{" "}
                  </Text>
                  {party.vehicleRegistration}
                </Text>
              )}

              {party.contactDetails && (
                <Text style={styles.text}>
                  <Text style={styles.label}>
                    Contact:{" "}
                  </Text>
                  {party.contactDetails}
                </Text>
              )}

              {party.insurer && (
                <>
                  <Text style={styles.text}>
                    <Text style={styles.label}>
                      Insurer:{" "}
                    </Text>
                    {party.insurer.name}
                  </Text>

                  <Text style={styles.text}>
                    <Text style={styles.label}>
                      Insurer Email:{" "}
                    </Text>
                    {party.insurer.email}
                  </Text>
                </>
              )}
            </View>
          ))}
        </View>

        {/* Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Scene Measurements
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.measurementName}>
                Measurement
              </Text>

              <Text style={styles.measurementDistance}>
                Distance
              </Text>
            </View>

            {measurements.map((measurement, index) => (
              <View
                key={index}
                style={styles.tableRow}
                wrap={false}
              >
                <Text style={styles.measurementName}>
                  {measurement.label}
                </Text>

                <Text style={styles.measurementDistance}>
                  {measurement.distanceMeters.toFixed(2)} m
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Narrative */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            AI-Assisted Summary
          </Text>

          <View style={styles.narrativeBox}>
            <Text style={styles.aiLabel}>
              AI-ASSISTED CONTENT
            </Text>

            <Text style={styles.narrativeText}>
              {narrative}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated by PRJ381 Drone Accident Modelling System
        </Text>
      </Page>
    </Document>
  );
}