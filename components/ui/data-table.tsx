"use client"

import { useEffect, useState } from "react"
import {
	type ColumnDef,
	type PaginationState,
	type Table as ReactTableInstance,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon, Settings2Icon } from "lucide-react"

import { useLocalStorage } from "@/lib/hooks/use-local-storage"

import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./table"
import { cn } from "@/lib/utils"

const PAGE_SIZES = [10, 25, 50, 100]
const EMPTY_COLUMN_VISIBILITY: VisibilityState = {}

type BaseDataTableProps<TData> = {
	columns: ColumnDef<TData, unknown>[]
	data: TData[]
	storageKey?: string
	defaultColumnVisibility?: VisibilityState
	emptyMessage?: string
	columnLayout?: "auto" | "fixed"
	toolbarLeft?: React.ReactNode
}

type ClientPaginationProps = {
	paginationMode?: "client"
	defaultPageSize?: number
}

type ServerPaginationProps = {
	paginationMode: "server"
	pageIndex: number
	pageSize: number
	hasNextPage: boolean
	isLoading?: boolean
	onPageIndexChange: (pageIndex: number) => void
}

type DataTableProps<TData> = BaseDataTableProps<TData> & (ClientPaginationProps | ServerPaginationProps)

type PaginationFooterProps = {
	show: boolean
	label: string
	pageSize?: number
	pageNumber?: number
	isLoading?: boolean
	canPreviousPage: boolean
	canNextPage: boolean
	onPageSizeChange?: (pageSize: number) => void
	onPageNumberChange?: (pageNumber: number) => void
	onPreviousPage: () => void
	onNextPage: () => void
}

type DataTableViewProps<TData> = BaseDataTableProps<TData> & {
	table: ReactTableInstance<TData>
	pagination: PaginationFooterProps
}

function DataTableView<TData>({
	data,
	emptyMessage = "No data to show.",
	table,
	pagination,
	columnLayout = "auto",
	toolbarLeft,
}: DataTableViewProps<TData>) {
	const hasRows = data.length > 0
	const hideableColumns = table.getAllColumns().filter((col) => col.getCanHide())

	function commitPageInput(value: string) {
		if (pagination.pageNumber == null || !pagination.onPageNumberChange) {
			return
		}

		const parsed = Number.parseInt(value, 10)

		if (!Number.isSafeInteger(parsed) || parsed < 1) {
			return
		}

		if (parsed !== pagination.pageNumber) {
			pagination.onPageNumberChange(parsed)
		}
	}

	const toolbar = hideableColumns.length > 0 ? (
		<Popover>
			<PopoverTrigger
				render={
					<Button variant="outline" size="sm">
						<Settings2Icon data-icon="inline-start" />
						Columns
					</Button>
				}
			/>
			<PopoverContent align="end" className="w-56 p-2">
				<div className="flex flex-col">
					{hideableColumns.map((column) => (
						<label
							key={column.id}
							className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
						>
							<Checkbox
								checked={column.getIsVisible()}
								onCheckedChange={(val) => column.toggleVisibility(!!val)}
							/>
							{typeof column.columnDef.header === "string"
								? column.columnDef.header
								: column.id}
						</label>
					))}
				</div>
			</PopoverContent>
		</Popover>
	) : null

	return (
		<div className="space-y-3">
			{toolbarLeft || toolbar ? (
				<div className="flex items-center justify-between gap-4">
					<div className="min-w-0 flex-1">{toolbarLeft}</div>
					{toolbar ? <div className="shrink-0">{toolbar}</div> : null}
				</div>
			) : null}

			{hasRows ? (
				<div className="overflow-hidden rounded-lg bg-card">
					<Table className={cn(columnLayout === "fixed" && "w-max min-w-full table-fixed")}>
						{columnLayout === "fixed" ? (
							<colgroup>
								{table.getVisibleLeafColumns().map((column) => (
									<col
										key={column.id}
										style={
											column.columnDef.size != null
												? { width: `${column.columnDef.size}px` }
												: undefined
										}
									/>
								))}
							</colgroup>
						) : null}
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id} className="bg-card text-muted-foreground hover:bg-card">
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id} className="px-4 py-2 font-medium">
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} className="bg-card text-foreground/90 hover:bg-card">
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="px-4 py-2">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : (
				<div className="overflow-hidden rounded-lg bg-card px-4 py-12 text-center text-muted-foreground sm:px-6">
					{emptyMessage}
				</div>
			)}

			{pagination.show && (
				<div className="flex items-center justify-between gap-4 px-1 text-sm text-muted-foreground">
					<p>{pagination.label}</p>
					<div className="flex items-center gap-2">
						{pagination.isLoading ? <p>Loading…</p> : null}
						{pagination.onPageSizeChange && pagination.pageSize != null ? (
							<select
								className="h-7 rounded-sm border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
								value={pagination.pageSize}
								onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
								disabled={pagination.isLoading}
							>
								{PAGE_SIZES.map((size) => (
									<option key={size} value={size}>
										{size} / page
									</option>
								))}
							</select>
						) : null}
						{pagination.onPageNumberChange && pagination.pageNumber != null ? (
							<label className="flex items-center gap-2">
								<span>Page</span>
								<input
									key={pagination.pageNumber}
									type="number"
									min={1}
									inputMode="numeric"
									className="h-7 w-16 rounded-sm border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
									defaultValue={pagination.pageNumber}
									onBlur={(e) => commitPageInput(e.currentTarget.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.currentTarget.blur()
										}
									}}
									disabled={pagination.isLoading}
									aria-label="Current page"
								/>
							</label>
						) : null}
						<Button
							variant="outline"
							size="icon-sm"
							onClick={pagination.onPreviousPage}
							disabled={!pagination.canPreviousPage || pagination.isLoading}
							aria-label="Previous page"
						>
							<ChevronLeftIcon />
						</Button>
						<Button
							variant="outline"
							size="icon-sm"
							onClick={pagination.onNextPage}
							disabled={!pagination.canNextPage || pagination.isLoading}
							aria-label="Next page"
						>
							<ChevronRightIcon />
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

function ClientPaginatedDataTable<TData>({
	columns,
	data,
	storageKey,
	defaultPageSize = 25,
	defaultColumnVisibility = EMPTY_COLUMN_VISIBILITY,
	emptyMessage,
	columnLayout = "auto",
	toolbarLeft,
}: BaseDataTableProps<TData> & ClientPaginationProps) {
	const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
		storageKey ? `${storageKey}-columns` : "__unused__",
		defaultColumnVisibility,
	)
	const [pageSize, setPageSize] = useLocalStorage<number>(
		storageKey ? `${storageKey}-page-size` : "__unused_ps__",
		defaultPageSize,
	)
	const [pagination, setPagination] = useState<PaginationState>(() => ({ pageIndex: 0, pageSize }))

	useEffect(() => {
		setPagination((current) => (
			current.pageSize === pageSize
				? current
				: { pageIndex: 0, pageSize }
		))
	}, [pageSize])

	useEffect(() => {
		setPagination((current) => {
			const maxPageIndex = Math.max(Math.ceil(data.length / current.pageSize) - 1, 0)

			return current.pageIndex > maxPageIndex
				? { ...current, pageIndex: maxPageIndex }
				: current
		})
	}, [data.length])

	const table = useReactTable({
		data,
		columns,
		state: {
			columnVisibility,
			pagination,
		},
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	})

	const { pageIndex, pageSize: currentPageSize } = table.getState().pagination
	const totalRows = table.getFilteredRowModel().rows.length
	const start = totalRows === 0 ? 0 : pageIndex * currentPageSize + 1
	const end = totalRows === 0 ? 0 : Math.min((pageIndex + 1) * currentPageSize, totalRows)

	return (
		<DataTableView
			columns={columns}
			data={data}
			storageKey={storageKey}
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage={emptyMessage}
			columnLayout={columnLayout}
			toolbarLeft={toolbarLeft}
			table={table}
			pagination={{
				show: totalRows > PAGE_SIZES[0],
				label: `${start}–${end} of ${totalRows}`,
				pageSize: currentPageSize,
				pageNumber: pageIndex + 1,
				canPreviousPage: table.getCanPreviousPage(),
				canNextPage: table.getCanNextPage(),
				onPreviousPage: () => table.previousPage(),
				onNextPage: () => table.nextPage(),
				onPageNumberChange: (nextPageNumber) => table.setPageIndex(nextPageNumber - 1),
				onPageSizeChange: (nextPageSize) => {
					setPageSize(nextPageSize)
					setPagination({ pageIndex: 0, pageSize: nextPageSize })
				},
			}}
		/>
	)
}

function ServerPaginatedDataTable<TData>({
	columns,
	data,
	storageKey,
	defaultColumnVisibility = EMPTY_COLUMN_VISIBILITY,
	emptyMessage,
	columnLayout = "auto",
	toolbarLeft,
	pageIndex,
	pageSize,
	hasNextPage,
	isLoading,
	onPageIndexChange,
}: BaseDataTableProps<TData> & ServerPaginationProps) {
	const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
		storageKey ? `${storageKey}-columns` : "__unused__",
		defaultColumnVisibility,
	)

	const table = useReactTable({
		data,
		columns,
		state: {
			columnVisibility,
		},
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
	})

	const start = data.length === 0 ? 0 : pageIndex * pageSize + 1
	const end = data.length === 0 ? 0 : pageIndex * pageSize + data.length

	return (
		<DataTableView
			columns={columns}
			data={data}
			storageKey={storageKey}
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage={emptyMessage}
			columnLayout={columnLayout}
			toolbarLeft={toolbarLeft}
			table={table}
			pagination={{
				show: pageIndex > 0 || hasNextPage || data.length > PAGE_SIZES[0],
				label: start === 0 ? "0 rows" : `${start}–${end}`,
				pageSize,
				pageNumber: pageIndex + 1,
				isLoading,
				canPreviousPage: pageIndex > 0,
				canNextPage: hasNextPage,
				onPreviousPage: () => onPageIndexChange(pageIndex - 1),
				onNextPage: () => onPageIndexChange(pageIndex + 1),
				onPageNumberChange: (nextPageNumber) => onPageIndexChange(nextPageNumber - 1),
			}}
		/>
	)
}

export function DataTable<TData>(props: DataTableProps<TData>) {
	if (props.paginationMode === "server") {
		return <ServerPaginatedDataTable {...props} />
	}

	return <ClientPaginatedDataTable {...props} />
}
