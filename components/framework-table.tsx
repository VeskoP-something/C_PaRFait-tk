"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PlusCircle,
  Edit,
  Save,
  X,
  Trash2,
  ChevronDown,
  HelpCircle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Presentation,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define types for our data structure
type Attribute = {
  id: string
  name: string
  tooltip: string
}

type AssetSubclass = {
  id: string
  name: string
  assetClassId: string
}

type AssetClass = {
  id: string
  name: string
  assetTypeId: string
  subclasses: AssetSubclass[]
}

type AssetType = {
  id: string
  name: string
  classes: AssetClass[]
}

type Safeguard = {
  id: string
  name: string
  controlId: string
  applicableAssetTypes: string[] // IDs of applicable asset types
}

type Control = {
  id: string
  name: string
  safeguards: Safeguard[]
}

type CellValue = {
  rowId: string // safeguardId + assetSubclassId
  attributeId: string
  value: string
}

type OutcomeValue = {
  rowId: string // safeguardId + assetSubclassId
  attributeId: string
  value: string
}

type EnforcementPoint = {
  rowId: string
  value: string
}

// Type for asset selection (type, class, or subclass)
type AssetSelection = {
  id: string
  name: string
  type: "type" | "class" | "subclass"
  parentId?: string // For classes, the parent asset type ID; for subclasses, the parent asset class ID
  typeId?: string // For subclasses, the grandparent asset type ID
}

// Type for export data
type ExportRow = {
  control: string
  safeguard: string
  assetType: string
  assetClass: string
  assetSubclass: string
  enforcementPoint: string
  [key: string]: string // For attribute values
}

export function FrameworkTable() {
  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("methods")

  // Default attributes with tooltips
  const [attributes, setAttributes] = useState<Attribute[]>([
    {
      id: "effectiveness",
      name: "Effectiveness",
      tooltip: "Does the Enforcement Point do what it's supposed to?",
    },
    {
      id: "efficiency",
      name: "Efficiency",
      tooltip: "Is resource usage acceptable (e.g. device resources, unit cost, time to complete)?",
    },
    {
      id: "coverage",
      name: "Coverage",
      tooltip: "Percent in-scope assets covered",
    },
    {
      id: "friction",
      name: "Friction",
      tooltip: "Does the Enforcement Point cause friction to end users or business operations?",
    },
  ])

  // Asset Types
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([
    {
      id: "devices",
      name: "Devices",
      classes: [
        {
          id: "endpoints",
          name: "Endpoints",
          assetTypeId: "devices",
          subclasses: [
            { id: "workstations", name: "Workstations", assetClassId: "endpoints" },
            { id: "laptops", name: "Laptops", assetClassId: "endpoints" },
            { id: "mobile", name: "Mobile Devices", assetClassId: "endpoints" },
          ],
        },
        {
          id: "network",
          name: "Network",
          assetTypeId: "devices",
          subclasses: [
            { id: "routers", name: "Routers", assetClassId: "network" },
            { id: "switches", name: "Switches", assetClassId: "network" },
            { id: "firewalls", name: "Firewalls", assetClassId: "network" },
          ],
        },
        {
          id: "servers",
          name: "Servers",
          assetTypeId: "devices",
          subclasses: [
            { id: "web-servers", name: "Web Servers", assetClassId: "servers" },
            { id: "database-servers", name: "Database Servers", assetClassId: "servers" },
            { id: "application-servers", name: "Application Servers", assetClassId: "servers" },
          ],
        },
      ],
    },
    {
      id: "software",
      name: "Software",
      classes: [
        {
          id: "operating-systems",
          name: "Operating Systems",
          assetTypeId: "software",
          subclasses: [
            { id: "os-services", name: "Services", assetClassId: "operating-systems" },
            { id: "os-libraries", name: "Libraries", assetClassId: "operating-systems" },
            { id: "os-apis", name: "APIs", assetClassId: "operating-systems" },
          ],
        },
        {
          id: "applications",
          name: "Applications",
          assetTypeId: "software",
          subclasses: [
            { id: "app-services", name: "Services", assetClassId: "applications" },
            { id: "app-libraries", name: "Libraries", assetClassId: "applications" },
            { id: "app-apis", name: "APIs", assetClassId: "applications" },
          ],
        },
      ],
    },
  ])

  // Sample initial data with applicable asset types
  const [controls, setControls] = useState<Control[]>([
    {
      id: "cis1",
      name: "CIS Control 1: Inventory and Control of Enterprise Assets",
      safeguards: [
        {
          id: "cis1.1",
          name: "Establish and Maintain Detailed Enterprise Asset Inventory",
          controlId: "cis1",
          applicableAssetTypes: ["devices"],
        },
        {
          id: "cis1.2",
          name: "Address Unauthorized Assets",
          controlId: "cis1",
          applicableAssetTypes: ["devices"],
        },
      ],
    },
    {
      id: "cis2",
      name: "CIS Control 2: Inventory and Control of Software Assets",
      safeguards: [
        {
          id: "cis2.1",
          name: "Establish and Maintain Software Inventory",
          controlId: "cis2",
          applicableAssetTypes: ["software"],
        },
        {
          id: "cis2.2",
          name: "Ensure Authorized Software is Currently Supported",
          controlId: "cis2",
          applicableAssetTypes: ["software"],
        },
      ],
    },
  ])

  // Generate rows based on safeguards and asset subclasses
  const [rows, setRows] = useState<
    { id: string; safeguardId: string; assetSubclassId: string; assetClassId?: string; assetTypeId?: string }[]
  >([
    {
      id: "cis1.1-workstations",
      safeguardId: "cis1.1",
      assetSubclassId: "workstations",
      assetClassId: "endpoints",
      assetTypeId: "devices",
    },
    {
      id: "cis1.1-laptops",
      safeguardId: "cis1.1",
      assetSubclassId: "laptops",
      assetClassId: "endpoints",
      assetTypeId: "devices",
    },
    {
      id: "cis1.2-firewalls",
      safeguardId: "cis1.2",
      assetSubclassId: "firewalls",
      assetClassId: "network",
      assetTypeId: "devices",
    },
    {
      id: "cis2.1-os-services",
      safeguardId: "cis2.1",
      assetSubclassId: "os-services",
      assetClassId: "operating-systems",
      assetTypeId: "software",
    },
    {
      id: "cis2.2-app-libraries",
      safeguardId: "cis2.2",
      assetSubclassId: "app-libraries",
      assetClassId: "applications",
      assetTypeId: "software",
    },
  ])

  // Cell values for measurement methods
  const [cellValues, setCellValues] = useState<CellValue[]>([
    { rowId: "cis1.1-workstations", attributeId: "effectiveness", value: "Monthly compliance scan success rate" },
    { rowId: "cis1.1-workstations", attributeId: "efficiency", value: "CPU/memory usage monitoring" },
    { rowId: "cis1.1-workstations", attributeId: "coverage", value: "Asset discovery vs. managed asset ratio" },
    { rowId: "cis1.1-workstations", attributeId: "friction", value: "User satisfaction survey (1-5 scale)" },

    { rowId: "cis1.1-laptops", attributeId: "effectiveness", value: "Weekly MDM compliance report" },
    { rowId: "cis1.1-laptops", attributeId: "efficiency", value: "Battery impact measurement" },
    { rowId: "cis1.1-laptops", attributeId: "coverage", value: "Network access logs vs. inventory" },
    { rowId: "cis1.1-laptops", attributeId: "friction", value: "Help desk tickets per month" },

    { rowId: "cis1.2-firewalls", attributeId: "effectiveness", value: "Unauthorized device detection rate" },
    { rowId: "cis1.2-firewalls", attributeId: "efficiency", value: "Throughput degradation measurement" },
    { rowId: "cis1.2-firewalls", attributeId: "coverage", value: "Network segment coverage audit" },
    { rowId: "cis1.2-firewalls", attributeId: "friction", value: "False positive rate tracking" },

    { rowId: "cis2.1-os-services", attributeId: "effectiveness", value: "Unauthorized service detection rate" },
    { rowId: "cis2.1-os-services", attributeId: "efficiency", value: "Scan completion time tracking" },
    { rowId: "cis2.1-os-services", attributeId: "coverage", value: "Server inventory reconciliation" },
    { rowId: "cis2.1-os-services", attributeId: "friction", value: "System admin feedback form" },

    { rowId: "cis2.2-app-libraries", attributeId: "effectiveness", value: "Vulnerable dependency detection rate" },
    { rowId: "cis2.2-app-libraries", attributeId: "efficiency", value: "CI/CD pipeline time impact" },
    { rowId: "cis2.2-app-libraries", attributeId: "coverage", value: "Repository scanning percentage" },
    { rowId: "cis2.2-app-libraries", attributeId: "friction", value: "Developer workflow impact survey" },
  ])

  // Cell values for outcomes
  const [outcomeValues, setOutcomeValues] = useState<OutcomeValue[]>([
    { rowId: "cis1.1-workstations", attributeId: "effectiveness", value: "High (92% compliance)" },
    { rowId: "cis1.1-workstations", attributeId: "efficiency", value: "Medium (8% CPU overhead)" },
    { rowId: "cis1.1-workstations", attributeId: "coverage", value: "95%" },
    { rowId: "cis1.1-workstations", attributeId: "friction", value: "Low (4.2/5 satisfaction)" },

    { rowId: "cis1.1-laptops", attributeId: "effectiveness", value: "Medium (87% compliance)" },
    { rowId: "cis1.1-laptops", attributeId: "efficiency", value: "Medium (12% battery impact)" },
    { rowId: "cis1.1-laptops", attributeId: "coverage", value: "88%" },
    { rowId: "cis1.1-laptops", attributeId: "friction", value: "Medium (15 tickets/month)" },

    { rowId: "cis1.2-firewalls", attributeId: "effectiveness", value: "High (98% detection)" },
    { rowId: "cis1.2-firewalls", attributeId: "efficiency", value: "High (3% throughput impact)" },
    { rowId: "cis1.2-firewalls", attributeId: "coverage", value: "100%" },
    { rowId: "cis1.2-firewalls", attributeId: "friction", value: "Low (2% false positives)" },

    { rowId: "cis2.1-os-services", attributeId: "effectiveness", value: "High (95% detection)" },
    { rowId: "cis2.1-os-services", attributeId: "efficiency", value: "High (4min scan time)" },
    { rowId: "cis2.1-os-services", attributeId: "coverage", value: "92%" },
    { rowId: "cis2.1-os-services", attributeId: "friction", value: "Low (4.5/5 admin rating)" },

    { rowId: "cis2.2-app-libraries", attributeId: "effectiveness", value: "Medium (85% detection)" },
    { rowId: "cis2.2-app-libraries", attributeId: "efficiency", value: "Medium (7min CI/CD impact)" },
    { rowId: "cis2.2-app-libraries", attributeId: "coverage", value: "78%" },
    { rowId: "cis2.2-app-libraries", attributeId: "friction", value: "Medium (3.2/5 dev rating)" },
  ])

  // Enforcement points
  const [enforcementPoints, setEnforcementPoints] = useState<EnforcementPoint[]>([
    { rowId: "cis1.1-workstations", value: "Endpoint Security Agent" },
    { rowId: "cis1.1-laptops", value: "MDM Solution" },
    { rowId: "cis1.2-firewalls", value: "Network Access Control" },
    { rowId: "cis2.1-os-services", value: "OS Service Scanner" },
    { rowId: "cis2.2-app-libraries", value: "Dependency Scanner" },
  ])

  // State for editing enforcement point
  const [editingEnforcementPoint, setEditingEnforcementPoint] = useState<string | null>(null)

  // State for editing cells
  const [editingCell, setEditingCell] = useState<{ rowId: string; attributeId: string } | null>(null)
  const [editValue, setEditValue] = useState("")

  // State for editing outcome cells
  const [editingOutcomeCell, setEditingOutcomeCell] = useState<{ rowId: string; attributeId: string } | null>(null)

  // State for new attribute dialog
  const [newAttributeName, setNewAttributeName] = useState("")
  const [newAttributeTooltip, setNewAttributeTooltip] = useState("")
  const [showAttributeDialog, setShowAttributeDialog] = useState(false)

  // State for new row dialog
  const [showRowDialog, setShowRowDialog] = useState(false)
  const [newRowSafeguard, setNewRowSafeguard] = useState("")
  const [newRowAssetType, setNewRowAssetType] = useState("")
  const [newRowAssetClass, setNewRowAssetClass] = useState("")
  const [newRowAssetSubclass, setNewRowAssetSubclass] = useState("")

  // State for delete confirmation
  const [rowToDelete, setRowToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Helper function to get cell value
  const getCellValue = (rowId: string, attributeId: string) => {
    const cell = cellValues.find((c) => c.rowId === rowId && c.attributeId === attributeId)
    return cell ? cell.value : ""
  }

  // Helper function to get outcome value
  const getOutcomeValue = (rowId: string, attributeId: string) => {
    const outcome = outcomeValues.find((o) => o.rowId === rowId && o.attributeId === attributeId)
    return outcome ? outcome.value : ""
  }

  // Helper function to get enforcement point value
  const getEnforcementPoint = (rowId: string) => {
    const point = enforcementPoints.find((p) => p.rowId === rowId)
    return point ? point.value : ""
  }

  // Helper function to get safeguard name
  const getSafeguardName = (safeguardId: string) => {
    for (const control of controls) {
      const safeguard = control.safeguards.find((s) => s.id === safeguardId)
      if (safeguard) return safeguard.name
    }
    return safeguardId
  }

  // Helper function to get safeguard by ID
  const getSafeguard = (safeguardId: string) => {
    for (const control of controls) {
      const safeguard = control.safeguards.find((s) => s.id === safeguardId)
      if (safeguard) return safeguard
    }
    return null
  }

  // Helper function to get asset name (type, class, or subclass)
  const getAssetName = (row: { assetSubclassId: string; assetClassId?: string; assetTypeId?: string }) => {
    // If it's a subclass
    if (row.assetSubclassId && row.assetSubclassId !== row.assetClassId && row.assetSubclassId !== row.assetTypeId) {
      for (const assetType of assetTypes) {
        for (const assetClass of assetType.classes) {
          const subclass = assetClass.subclasses.find((s) => s.id === row.assetSubclassId)
          if (subclass) {
            // For software subclasses, include the class name since Services, Libraries, APIs appear in both classes
            if (assetType.id === "software") {
              return `${subclass.name} (${assetClass.name})`
            }
            return subclass.name
          }
        }
      }
    }

    // If it's a class
    if (row.assetClassId && row.assetClassId !== row.assetTypeId) {
      for (const assetType of assetTypes) {
        const assetClass = assetType.classes.find((ac) => ac.id === row.assetClassId)
        if (assetClass) return assetClass.name
      }
    }

    // If it's a type
    if (row.assetTypeId) {
      const assetType = assetTypes.find((at) => at.id === row.assetTypeId)
      if (assetType) return assetType.name
    }

    return row.assetSubclassId // Fallback
  }

  // Helper function to get asset type name
  const getAssetTypeName = (assetTypeId?: string) => {
    if (!assetTypeId) return ""
    const assetType = assetTypes.find((at) => at.id === assetTypeId)
    return assetType ? assetType.name : ""
  }

  // Helper function to get asset class name
  const getAssetClassName = (assetClassId?: string) => {
    if (!assetClassId) return ""
    for (const assetType of assetTypes) {
      const assetClass = assetType.classes.find((ac) => ac.id === assetClassId)
      if (assetClass) return assetClass.name
    }
    return ""
  }

  // Helper function to get asset subclass name
  const getAssetSubclassName = (assetSubclassId: string) => {
    for (const assetType of assetTypes) {
      for (const assetClass of assetType.classes) {
        const subclass = assetClass.subclasses.find((s) => s.id === assetSubclassId)
        if (subclass) return subclass.name
      }
    }
    return assetSubclassId
  }

  // Helper function to get control name from safeguard ID
  const getControlNameFromSafeguard = (safeguardId: string) => {
    for (const control of controls) {
      if (control.safeguards.some((s) => s.id === safeguardId)) {
        return control.name
      }
    }
    return ""
  }

  // Get applicable asset types for a safeguard
  const getApplicableAssetTypes = (safeguardId: string) => {
    const safeguard = getSafeguard(safeguardId)
    if (!safeguard) return []

    return assetTypes.filter((type) => safeguard.applicableAssetTypes.includes(type.id))
  }

  // Get applicable asset selections for a safeguard
  const getApplicableAssetSelections = (safeguardId: string): AssetSelection[] => {
    const safeguard = getSafeguard(safeguardId)
    if (!safeguard) return []

    const selections: AssetSelection[] = []

    // Get applicable asset types
    const applicableTypes = getApplicableAssetTypes(safeguardId)

    // Add asset types, classes, and subclasses
    applicableTypes.forEach((assetType) => {
      // Add the type itself
      selections.push({
        id: assetType.id,
        name: assetType.name,
        type: "type",
      })

      // Add all classes for this type
      assetType.classes.forEach((assetClass) => {
        selections.push({
          id: assetClass.id,
          name: assetClass.name,
          type: "class",
          parentId: assetType.id,
        })

        // Add all subclasses for this class
        assetClass.subclasses.forEach((subclass) => {
          // For software subclasses, include the class name since Services, Libraries, APIs appear in both classes
          const displayName = assetType.id === "software" ? `${subclass.name} (${assetClass.name})` : subclass.name

          selections.push({
            id: subclass.id,
            name: displayName,
            type: "subclass",
            parentId: assetClass.id,
            typeId: assetType.id,
          })
        })
      })
    })

    return selections
  }

  // Handle asset selection change
  const handleAssetSelectionChange = (row: { id: string; safeguardId: string }, selection: AssetSelection) => {
    // Create a new row ID based on the selection
    const newRowId = `${row.safeguardId}-${selection.id}`

    // Check if this combination already exists
    if (rows.some((r) => r.id === newRowId && r.id !== row.id)) {
      alert("This combination already exists!")
      return
    }

    // Update the row
    const updatedRows = rows.map((r) => {
      if (r.id === row.id) {
        return {
          ...r,
          id: newRowId,
          assetSubclassId: selection.id,
          assetClassId:
            selection.type === "subclass" ? selection.parentId : selection.type === "class" ? selection.id : undefined,
          assetTypeId:
            selection.type === "type"
              ? selection.id
              : selection.type === "class"
                ? selection.parentId
                : selection.typeId,
        }
      }
      return r
    })

    // Update cell values with the new row ID
    const updatedCellValues = cellValues.map((cell) => {
      if (cell.rowId === row.id) {
        return {
          ...cell,
          rowId: newRowId,
        }
      }
      return cell
    })

    // Update outcome values with the new row ID
    const updatedOutcomeValues = outcomeValues.map((outcome) => {
      if (outcome.rowId === row.id) {
        return {
          ...outcome,
          rowId: newRowId,
        }
      }
      return outcome
    })

    // Update enforcement points with the new row ID
    const updatedEnforcementPoints = enforcementPoints.map((point) => {
      if (point.rowId === row.id) {
        return {
          ...point,
          rowId: newRowId,
        }
      }
      return point
    })

    // Update state
    setRows(updatedRows)
    setCellValues(updatedCellValues)
    setOutcomeValues(updatedOutcomeValues)
    setEnforcementPoints(updatedEnforcementPoints)
  }

  // Handle cell edit start
  const handleEditCell = (rowId: string, attributeId: string, currentValue: string) => {
    setEditingCell({ rowId, attributeId })
    setEditValue(currentValue)
  }

  // Handle outcome cell edit start
  const handleEditOutcomeCell = (rowId: string, attributeId: string, currentValue: string) => {
    setEditingOutcomeCell({ rowId, attributeId })
    setEditValue(currentValue)
  }

  // Handle enforcement point edit start
  const handleEditEnforcementPoint = (rowId: string, currentValue: string) => {
    setEditingEnforcementPoint(rowId)
    setEditValue(currentValue)
  }

  // Handle cell edit save
  const handleSaveCell = () => {
    if (!editingCell) return

    const { rowId, attributeId } = editingCell
    const existingCellIndex = cellValues.findIndex((c) => c.rowId === rowId && c.attributeId === attributeId)

    if (existingCellIndex >= 0) {
      // Update existing cell
      const updatedCells = [...cellValues]
      updatedCells[existingCellIndex].value = editValue
      setCellValues(updatedCells)
    } else {
      // Add new cell
      setCellValues([...cellValues, { rowId, attributeId, value: editValue }])
    }

    setEditingCell(null)
    setEditValue("")
  }

  // Handle outcome cell edit save
  const handleSaveOutcomeCell = () => {
    if (!editingOutcomeCell) return

    const { rowId, attributeId } = editingOutcomeCell
    const existingOutcomeIndex = outcomeValues.findIndex((o) => o.rowId === rowId && o.attributeId === attributeId)

    if (existingOutcomeIndex >= 0) {
      // Update existing outcome
      const updatedOutcomes = [...outcomeValues]
      updatedOutcomes[existingOutcomeIndex].value = editValue
      setOutcomeValues(updatedOutcomes)
    } else {
      // Add new outcome
      setOutcomeValues([...outcomeValues, { rowId, attributeId, value: editValue }])
    }

    setEditingOutcomeCell(null)
    setEditValue("")
  }

  // Handle enforcement point save
  const handleSaveEnforcementPoint = (rowId: string) => {
    const existingPointIndex = enforcementPoints.findIndex((p) => p.rowId === rowId)

    if (existingPointIndex >= 0) {
      // Update existing enforcement point
      const updatedPoints = [...enforcementPoints]
      updatedPoints[existingPointIndex].value = editValue
      setEnforcementPoints(updatedPoints)
    } else {
      // Add new enforcement point
      setEnforcementPoints([...enforcementPoints, { rowId, value: editValue }])
    }

    setEditingEnforcementPoint(null)
    setEditValue("")
  }

  // Handle adding a new attribute
  const handleAddAttribute = () => {
    if (!newAttributeName.trim()) return

    const newId = newAttributeName.toLowerCase().replace(/\s+/g, "_")
    setAttributes([
      ...attributes,
      {
        id: newId,
        name: newAttributeName,
        tooltip: newAttributeTooltip,
      },
    ])
    setNewAttributeName("")
    setNewAttributeTooltip("")
    setShowAttributeDialog(false)
  }

  // Get asset classes for a selected asset type
  const getAssetClassesForType = (assetTypeId: string) => {
    const assetType = assetTypes.find((type) => type.id === assetTypeId)
    return assetType ? assetType.classes : []
  }

  // Get asset subclasses for a selected asset class
  const getAssetSubclassesForClass = (assetClassId: string) => {
    for (const assetType of assetTypes) {
      const assetClass = assetType.classes.find((cls) => cls.id === assetClassId)
      if (assetClass) {
        return assetClass.subclasses
      }
    }
    return []
  }

  // Handle adding a new row
  const handleAddRow = () => {
    if (!newRowSafeguard || !newRowAssetSubclass) return

    const newRowId = `${newRowSafeguard}-${newRowAssetSubclass}`

    // Check if row already exists
    if (rows.some((r) => r.id === newRowId)) {
      alert("This combination already exists!")
      return
    }

    // Determine asset class and type IDs
    let assetClassId: string | undefined
    let assetTypeId: string | undefined

    // If we selected a subclass
    if (newRowAssetClass && newRowAssetType) {
      assetClassId = newRowAssetClass
      assetTypeId = newRowAssetType
    }
    // If we selected a class
    else if (newRowAssetType) {
      // Check if the selection is an asset class
      for (const assetType of assetTypes) {
        if (assetType.id === newRowAssetType) {
          const assetClass = assetType.classes.find((cls) => cls.id === newRowAssetSubclass)
          if (assetClass) {
            assetClassId = assetClass.id
            assetTypeId = assetType.id
            break
          }
        }
      }
    }

    // If we couldn't determine the class/type, try to infer them
    if (!assetClassId || !assetTypeId) {
      for (const assetType of assetTypes) {
        for (const assetClass of assetType.classes) {
          // Check if the selection is a subclass
          const subclass = assetClass.subclasses.find((sub) => sub.id === newRowAssetSubclass)
          if (subclass) {
            assetClassId = assetClass.id
            assetTypeId = assetType.id
            break
          }
        }
        if (assetClassId && assetTypeId) break
      }
    }

    setRows([
      ...rows,
      {
        id: newRowId,
        safeguardId: newRowSafeguard,
        assetSubclassId: newRowAssetSubclass,
        assetClassId,
        assetTypeId,
      },
    ])

    setNewRowSafeguard("")
    setNewRowAssetType("")
    setNewRowAssetClass("")
    setNewRowAssetSubclass("")
    setShowRowDialog(false)
  }

  // Handle row deletion
  const handleDeleteRow = (rowId: string) => {
    setRowToDelete(rowId)
    setShowDeleteDialog(true)
  }

  // Confirm and execute row deletion
  const confirmDeleteRow = () => {
    if (!rowToDelete) return

    // Remove the row
    setRows(rows.filter((row) => row.id !== rowToDelete))

    // Remove all cell values associated with this row
    setCellValues(cellValues.filter((cell) => cell.rowId !== rowToDelete))

    // Remove all outcome values associated with this row
    setOutcomeValues(outcomeValues.filter((outcome) => outcome.rowId !== rowToDelete))

    // Remove enforcement point associated with this row
    setEnforcementPoints(enforcementPoints.filter((point) => point.rowId !== rowToDelete))

    // Reset state
    setRowToDelete(null)
    setShowDeleteDialog(false)
  }

  // Get all safeguards from all controls
  const getAllSafeguards = () => {
    return controls.flatMap((control) => control.safeguards)
  }

  // Prepare data for export
  const prepareExportData = (useOutcomes = false): ExportRow[] => {
    return rows.map((row) => {
      const exportRow: ExportRow = {
        control: getControlNameFromSafeguard(row.safeguardId),
        safeguard: getSafeguardName(row.safeguardId),
        assetType: getAssetTypeName(row.assetTypeId),
        assetClass: getAssetClassName(row.assetClassId),
        assetSubclass: getAssetSubclassName(row.assetSubclassId),
        enforcementPoint: getEnforcementPoint(row.id) || "",
      }

      // Add attribute values
      attributes.forEach((attr) => {
        if (useOutcomes) {
          exportRow[attr.name] = getOutcomeValue(row.id, attr.id)
        } else {
          exportRow[attr.name] = getCellValue(row.id, attr.id)
        }
      })

      return exportRow
    })
  }

  // Export as JSON
  const exportAsJSON = () => {
    const methodsData = prepareExportData(false)
    const outcomesData = prepareExportData(true)

    const exportData = {
      methods: methodsData,
      outcomes: outcomesData,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "CTRL_PaRFait_Export.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export as CSV (spreadsheet)
  const exportAsSpreadsheet = () => {
    const useOutcomes = activeTab === "outcomes"
    const data = prepareExportData(useOutcomes)

    // Create CSV header
    const headers = [
      "Control",
      "Safeguard",
      "Asset Type",
      "Asset Class",
      "Asset Subclass",
      "Enforcement Point",
      ...attributes.map((a) => a.name),
    ]

    // Create CSV rows
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        [
          `"${row.control}"`,
          `"${row.safeguard}"`,
          `"${row.assetType}"`,
          `"${row.assetClass}"`,
          `"${row.assetSubclass}"`,
          `"${row.enforcementPoint}"`,
          ...attributes.map((attr) => `"${row[attr.name] || ""}"`),
        ].join(","),
      ),
    ]

    const csvString = csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `CTRL_PaRFait_${useOutcomes ? "Outcomes" : "Methods"}_Export.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export as PDF
  const exportAsPDF = () => {
    // Create a printable version in a new window
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups to export as PDF")
      return
    }

    const useOutcomes = activeTab === "outcomes"
    const data = prepareExportData(useOutcomes)
    const title = useOutcomes ? "Assessment Outcomes" : "Measurement Methods"

    // Create HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CTRL_PaRFait ${title} Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #555; margin-top: 30px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .description { color: #666; margin-bottom: 20px; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()">Print as PDF</button>
          <p>To save as PDF, use your browser's print function and select "Save as PDF" as the destination.</p>
        </div>
        
        <h1>Control Performance and Reliability Framework (CTRL_PaRFait)</h1>
        ${
          useOutcomes
            ? `<p class="description">Sample output from point in time assessment of control performance and reliability demonstrating the outcome of the measurements taken using the TTPs defined in the framework.</p>`
            : `<p class="description">A framework to maintain the Tools, Techniques, Procedures used to measure and monitor the performance and reliability of security controls.</p>`
        }
        
        <h2>${title}</h2>
        
        <table>
          <thead>
            <tr>
              <th>Control</th>
              <th>Safeguard</th>
              <th>Asset Type</th>
              <th>Asset Class</th>
              <th>Asset Subclass</th>
              <th>Enforcement Point</th>
              ${attributes.map((attr) => `<th>${attr.name}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                <td>${row.control}</td>
                <td>${row.safeguard}</td>
                <td>${row.assetType}</td>
                <td>${row.assetClass}</td>
                <td>${row.assetSubclass}</td>
                <td>${row.enforcementPoint}</td>
                ${attributes.map((attr) => `<td>${row[attr.name] || ""}</td>`).join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  // Export as Slide (PowerPoint-like format)
  const exportAsSlide = () => {
    // Create a printable version in a new window optimized for slides
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups to export as slides")
      return
    }

    const useOutcomes = activeTab === "outcomes"
    const data = prepareExportData(useOutcomes)
    const title = useOutcomes ? "Assessment Outcomes" : "Measurement Methods"
    const description = useOutcomes
      ? "Sample output from point in time assessment of control performance and reliability demonstrating the outcome of the measurements taken using the TTPs defined in the framework."
      : "A framework to maintain the Tools, Techniques, Procedures used to measure and monitor the performance and reliability of security controls."

    // Group data by control for slide organization
    const controlGroups: Record<string, ExportRow[]> = {}
    data.forEach((row) => {
      if (!controlGroups[row.control]) {
        controlGroups[row.control] = []
      }
      controlGroups[row.control].push(row)
    })

    // Create HTML content for slides
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CTRL_PaRFait ${title} Slides</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .slide { page-break-after: always; height: 100vh; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; }
          .slide-title { font-size: 24px; margin-bottom: 20px; }
          .slide-subtitle { font-size: 20px; margin-bottom: 15px; color: #555; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f2f2f2; }
          .title-slide { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
          .title-slide h1 { font-size: 36px; margin-bottom: 20px; }
          .title-slide p { font-size: 18px; color: #666; max-width: 80%; line-height: 1.5; }
          .controls-slide ul { font-size: 18px; }
          .controls-slide li { margin-bottom: 10px; }
          .no-print { position: fixed; top: 10px; right: 10px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()">Print as PDF</button>
          <p>To save as slides, use your browser's print function and select "Save as PDF" as the destination.</p>
        </div>
        
        <!-- Title Slide -->
        <div class="slide title-slide">
          <h1>Control Performance and Reliability Framework (CTRL_PaRFait)</h1>
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
        
        <!-- Overview Slide -->
        <div class="slide controls-slide">
          <h2 class="slide-title">CIS Controls Overview</h2>
          <ul>
            ${Object.keys(controlGroups)
              .map(
                (control) => `
              <li>${control}</li>
            `,
              )
              .join("")}
          </ul>
        </div>
        
        <!-- Control Slides -->
        ${Object.entries(controlGroups)
          .map(
            ([control, rows]) => `
          <div class="slide">
            <h2 class="slide-title">${control}</h2>
            <table>
              <thead>
                <tr>
                  <th>Safeguard</th>
                  <th>Asset Type</th>
                  <th>Asset Class/Subclass</th>
                  <th>Enforcement Point</th>
                  ${attributes.map((attr) => `<th>${attr.name}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (row) => `
                  <tr>
                    <td>${row.safeguard}</td>
                    <td>${row.assetType}</td>
                    <td>${row.assetSubclass} (${row.assetClass})</td>
                    <td>${row.enforcementPoint}</td>
                    ${attributes.map((attr) => `<td>${row[attr.name] || ""}</td>`).join("")}
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `,
          )
          .join("")}
        
        <!-- Attributes Slide -->
        <div class="slide">
          <h2 class="slide-title">Attributes Explanation</h2>
          <table>
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${attributes
                .map(
                  (attr) => `
                <tr>
                  <td>${attr.name}</td>
                  <td>${attr.tooltip}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold">Control Performance and Reliability Framework (CTRL_PaRFait)</h1>
        <p className="text-muted-foreground">
          A framework to maintain the Tools, Techniques, Procedures used to measure and monitor the performance and
          reliability of security controls. It&apos;s based on CIS Cricital Controls because they&apos;re simple yet
          comprehensive. Measurements can be defined per Asset Type, Asset Class, or Asset Subclass and per Safeguard
          depending on how many Enforcement Points (or Tools) you have for that Safeguard.
        </p>
      </div>

      <div className="flex justify-end items-center mb-4">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsSpreadsheet}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsSlide}>
                <Presentation className="h-4 w-4 mr-2" />
                Export as Slide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showAttributeDialog} onOpenChange={setShowAttributeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Attribute
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Attribute</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Attribute Name</label>
                  <Input
                    value={newAttributeName}
                    onChange={(e) => setNewAttributeName(e.target.value)}
                    placeholder="Enter attribute name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tooltip Description</label>
                  <Input
                    value={newAttributeTooltip}
                    onChange={(e) => setNewAttributeTooltip(e.target.value)}
                    placeholder="Enter tooltip text"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAttributeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAttribute}>Add Attribute</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showRowDialog} onOpenChange={setShowRowDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Asset Mapping
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset Mapping</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Safeguard</label>
                  <Select
                    value={newRowSafeguard}
                    onValueChange={(value) => {
                      setNewRowSafeguard(value)
                      // Reset asset selections when safeguard changes
                      setNewRowAssetType("")
                      setNewRowAssetClass("")
                      setNewRowAssetSubclass("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select safeguard" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllSafeguards().map((safeguard) => (
                        <SelectItem key={safeguard.id} value={safeguard.id}>
                          {safeguard.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newRowSafeguard && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Asset Type</label>
                    <Select
                      value={newRowAssetType}
                      onValueChange={(value) => {
                        setNewRowAssetType(value)
                        // Reset class and subclass when type changes
                        setNewRowAssetClass("")
                        setNewRowAssetSubclass("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        {getApplicableAssetTypes(newRowSafeguard).map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newRowAssetType && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Asset Class</label>
                    <Select
                      value={newRowAssetClass}
                      onValueChange={(value) => {
                        setNewRowAssetClass(value)
                        // Reset subclass when class changes
                        setNewRowAssetSubclass("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset class" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAssetClassesForType(newRowAssetType).map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newRowAssetClass && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Asset Subclass</label>
                    <Select value={newRowAssetSubclass} onValueChange={setNewRowAssetSubclass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset subclass" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAssetSubclassesForClass(newRowAssetClass).map((subclass) => (
                          <SelectItem key={subclass.id} value={subclass.id}>
                            {subclass.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRow} disabled={!newRowSafeguard || !newRowAssetSubclass}>
                  Add Mapping
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this row? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRow}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="methods" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="methods">Measurement Methods</TabsTrigger>
          <TabsTrigger value="outcomes">Assessment Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="mt-0">
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px] font-bold">Control/Safeguard</TableHead>
                  <TableHead className="w-[200px] font-bold">Asset Class or Subclass</TableHead>
                  <TableHead className="w-[200px] font-bold">Enforcement Point</TableHead>
                  <TooltipProvider>
                    {attributes.map((attr) => (
                      <TableHead key={attr.id} className="min-w-[150px] font-bold">
                        <div className="flex items-center gap-1">
                          {attr.name}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                                <HelpCircle className="h-3 w-3" />
                                <span className="sr-only">Help</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{attr.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                    ))}
                  </TooltipProvider>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {getControlNameFromSafeguard(row.safeguardId)}
                          </div>
                          <div>{getSafeguardName(row.safeguardId)}</div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRow(row.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="flex justify-between w-full">
                            <span>{getAssetName(row)}</span>
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[250px]">
                          {getApplicableAssetSelections(row.safeguardId).map((selection, index, array) => {
                            // Add separators between asset types
                            const prevItem = index > 0 ? array[index - 1] : null
                            const showSeparator = prevItem && prevItem.type === "subclass" && selection.type === "type"

                            return (
                              <div key={selection.id}>
                                {showSeparator && <DropdownMenuSeparator />}
                                <DropdownMenuItem onClick={() => handleAssetSelectionChange(row, selection)}>
                                  {selection.type === "type" ? (
                                    <strong className="text-primary">{selection.name}</strong>
                                  ) : selection.type === "class" ? (
                                    <span className="pl-2 font-medium">{selection.name}</span>
                                  ) : (
                                    <span className="pl-4">{selection.name}</span>
                                  )}
                                </DropdownMenuItem>
                              </div>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      {editingEnforcementPoint === row.id ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveEnforcementPoint(row.id)}
                            className="h-8 w-8"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingEnforcementPoint(null)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex justify-between items-center group"
                          onClick={() => handleEditEnforcementPoint(row.id, getEnforcementPoint(row.id))}
                        >
                          <span>{getEnforcementPoint(row.id) || "-"}</span>
                          <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    {attributes.map((attr) => (
                      <TableCell key={`${row.id}-${attr.id}`}>
                        {editingCell && editingCell.rowId === row.id && editingCell.attributeId === attr.id ? (
                          <div className="flex items-center space-x-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" onClick={handleSaveCell} className="h-8 w-8">
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingCell(null)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="flex justify-between items-center group"
                            onClick={() => handleEditCell(row.id, attr.id, getCellValue(row.id, attr.id))}
                          >
                            <span>{getCellValue(row.id, attr.id) || "-"}</span>
                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="outcomes" className="mt-0">
          <div className="mb-4">
            <p className="text-muted-foreground">
              Sample output from point in time assessment of control performance and reliability demonstrating the
              outcome of the measurements taken using the TTPs defined in the framework.
            </p>
          </div>
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px] font-bold">Control/Safeguard</TableHead>
                  <TableHead className="w-[200px] font-bold">Asset Class or Subclass</TableHead>
                  <TableHead className="w-[200px] font-bold">Enforcement Point</TableHead>
                  <TooltipProvider>
                    {attributes.map((attr) => (
                      <TableHead key={attr.id} className="min-w-[150px] font-bold">
                        <div className="flex items-center gap-1">
                          {attr.name}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                                <HelpCircle className="h-3 w-3" />
                                <span className="sr-only">Help</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{attr.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                    ))}
                  </TooltipProvider>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {getControlNameFromSafeguard(row.safeguardId)}
                          </div>
                          <div>{getSafeguardName(row.safeguardId)}</div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRow(row.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="flex justify-between w-full">
                            <span>{getAssetName(row)}</span>
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[250px]">
                          {getApplicableAssetSelections(row.safeguardId).map((selection, index, array) => {
                            // Add separators between asset types
                            const prevItem = index > 0 ? array[index - 1] : null
                            const showSeparator = prevItem && prevItem.type === "subclass" && selection.type === "type"

                            return (
                              <div key={selection.id}>
                                {showSeparator && <DropdownMenuSeparator />}
                                <DropdownMenuItem onClick={() => handleAssetSelectionChange(row, selection)}>
                                  {selection.type === "type" ? (
                                    <strong className="text-primary">{selection.name}</strong>
                                  ) : selection.type === "class" ? (
                                    <span className="pl-2 font-medium">{selection.name}</span>
                                  ) : (
                                    <span className="pl-4">{selection.name}</span>
                                  )}
                                </DropdownMenuItem>
                              </div>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      {editingEnforcementPoint === row.id ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveEnforcementPoint(row.id)}
                            className="h-8 w-8"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingEnforcementPoint(null)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex justify-between items-center group"
                          onClick={() => handleEditEnforcementPoint(row.id, getEnforcementPoint(row.id))}
                        >
                          <span>{getEnforcementPoint(row.id) || "-"}</span>
                          <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    {attributes.map((attr) => (
                      <TableCell key={`${row.id}-${attr.id}`}>
                        {editingOutcomeCell &&
                        editingOutcomeCell.rowId === row.id &&
                        editingOutcomeCell.attributeId === attr.id ? (
                          <div className="flex items-center space-x-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" onClick={handleSaveOutcomeCell} className="h-8 w-8">
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingOutcomeCell(null)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="flex justify-between items-center group"
                            onClick={() => handleEditOutcomeCell(row.id, attr.id, getOutcomeValue(row.id, attr.id))}
                          >
                            <span>{getOutcomeValue(row.id, attr.id) || "-"}</span>
                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
