from flask import Flask, render_template, request, jsonify, send_file
import io

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/compute", methods=["POST"])
def compute():
    data = request.get_json()
    subjects = data.get("subjects", [])
    
    total_products = 0.0
    total_units = 0.0
    valid_count = 0
    
    for sub in subjects:
        try:
            units = float(sub.get("units", 0))
            grade = float(sub.get("grade", 0))
            if units > 0 and grade > 0:
                total_products += grade * units
                total_units += units
                valid_count += 1
        except (ValueError, TypeError):
            continue
            
    if total_units == 0:
        return jsonify({
            "gwa": "0.00", 
            "total_units": 0, 
            "total_subjects": 0, 
            "remarks": "—"
        })
        
    gwa = total_products / total_units
    remarks = "Passed" if gwa <= 3.00 else "Failed"
        
    return jsonify({
        "gwa": f"{gwa:.2f}",
        "total_units": total_units,
        "total_subjects": valid_count,
        "remarks": remarks
    })

@app.route("/download", methods=["POST"])
def download():
    data = request.get_json()
    subjects = data.get("subjects", [])
    
    if not subjects:
        return jsonify({"error": "No subject data provided"}), 400
        
    # Pag-set up ng text content para sa .txt file
    lines = []
    lines.append("=========================================")
    lines.append("        GWA COMPUTATION REPORT           ")
    lines.append("=========================================\n")
    lines.append("SUBJECT DETAILS:")
    lines.append(f"{'#':<4} {'Subject Name':<25} {'Units':<8} {'Grade':<8} {'Grade x Units':<12}")
    lines.append("-" * 60)
    
    total_products = 0.0
    total_units = 0.0
    valid_count = 0
    
    for idx, sub in enumerate(subjects, 1):
        try:
            name = sub.get("name", "").strip() or f"Subject {idx}"
            units = float(sub.get("units", 0))
            grade = float(sub.get("grade", 0))
            
            if units > 0 and grade > 0:
                product = grade * units
                total_products += product
                total_units += units
                valid_count += 1
                lines.append(f"{idx:<4} {name:<25} {units:<8.1f} {grade:<8.2f} {product:<12.2f}")
        except (ValueError, TypeError):
            continue

    if total_units == 0:
        return jsonify({"error": "Invalid units/grades"}), 400

    gwa = total_products / total_units
    remarks = "Passed" if gwa <= 3.00 else "Failed"

    lines.append("-" * 60)
    lines.append("\nFORMULA & COMPUTATION STEPS:")
    lines.append("1. Sum of (Grade x Units) = " + " + ".join([f"({s['grade']} * {s['units']})" for s in subjects if s.get("units") and s.get("grade")]))
    lines.append(f"   Total Grade Points = {total_products:.2f}")
    lines.append(f"2. Total Units = {total_units:.1f}")
    lines.append(f"3. GWA = Total Grade Points / Total Units")
    lines.append(f"   GWA = {total_products:.2f} / {total_units:.1f} = {gwa:.4f}")
    
    lines.append("\n=========================================")
    lines.append("FINAL RESULT:")
    lines.append("=========================================")
    lines.append(f"  GWA:            {gwa:.2f}")
    lines.append(f"  Total Subjects: {valid_count}")
    lines.append(f"  Total Units:    {total_units:.1f}")
    lines.append(f"  Remarks:        {remarks}")
    lines.append("=========================================")

    content = "\n".join(lines)
    
    # Lumikha ng in-memory file at i-download
    buffer = io.BytesIO()
    buffer.write(content.encode('utf-8'))
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name="gwa_computation_result.txt",
        mimetype="text/plain"
    )

if __name__ == "__main__":
    app.run(debug=True)