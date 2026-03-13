/**
 * SVG 기반 멀티 라인 차트 (N개 선)
 * 의존성: react-native, react-native-svg
 * 특징: N개 데이터셋 동시 표시, 범례, 겹침 방지 툴팁
 */
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface MultiLineDataSet {
    data: Array<[string, number]>;
    color: string;
    label: string;
}

export interface SVGMultiLineChartColors {
    axis?: string;
    grid?: string;
    tooltipBg?: string;
    tooltipBorder?: string;
    tooltipText?: string;
    labelText?: string;
    legendText?: string;
    loadingText?: string;
}

interface SVGMultiLineChartProps {
    dataSets: MultiLineDataSet[];
    width: number;
    height?: number;
    maxValue?: number;
    unit?: string;
    colors?: SVGMultiLineChartColors;
}

const DEFAULT_COLORS: SVGMultiLineChartColors = {
    axis: '#E5E5E5',
    grid: '#E5E5E5',
    tooltipBg: '#FFFFFF',
    tooltipBorder: '#E5E5E5',
    tooltipText: '#333333',
    labelText: '#999999',
    legendText: '#333333',
    loadingText: '#999999',
};

const SVGMultiLineChartComponent = ({
    dataSets,
    width,
    height = 100,
    maxValue = 15,
    unit = '회',
    colors: colorsProp,
}: SVGMultiLineChartProps) => {
    const c = { ...DEFAULT_COLORS, ...colorsProp };
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const chartWidth = width * 0.88;
    const chartPadding = { top: 10, right: 5, bottom: 5, left: 5 };
    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = height - chartPadding.top - chartPadding.bottom;
    const legendHeight = 25;

    const calculatePoints = useCallback((data: Array<[string, number]>) => {
        if (data.length === 0) return [];

        const spacing = innerWidth / Math.max(data.length - 1, 1);

        return data.map(([label, value], i) => {
            const chartValue = Math.min(value, maxValue);
            return {
                x: chartPadding.left + (data.length === 1 ? innerWidth / 2 : i * spacing),
                y: chartPadding.top + innerHeight - (chartValue / maxValue) * innerHeight,
                label,
                value: chartValue,
                originalValue: value,
            };
        });
    }, [innerWidth, innerHeight, maxValue]);

    const allPoints = useMemo(() =>
        dataSets.map(ds => calculatePoints(ds.data)),
        [dataSets, calculatePoints]
    );

    const createLinePath = useCallback((points: ReturnType<typeof calculatePoints>) => {
        if (points.length === 0) return '';
        const firstPoint = points[0];
        if (!firstPoint) return '';

        let path = `M ${firstPoint.x} ${firstPoint.y}`;
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point) {
                path += ` L ${point.x} ${point.y}`;
            }
        }
        return path;
    }, []);

    const createAreaPath = useCallback((points: ReturnType<typeof calculatePoints>) => {
        if (points.length === 0) return '';
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        if (!firstPoint || !lastPoint) return '';

        const bottomY = chartPadding.top + innerHeight;
        let path = `M ${firstPoint.x} ${bottomY}`;
        path += ` L ${firstPoint.x} ${firstPoint.y}`;

        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point) {
                path += ` L ${point.x} ${point.y}`;
            }
        }

        path += ` L ${lastPoint.x} ${bottomY}`;
        path += ' Z';
        return path;
    }, [innerHeight]);

    const linePaths = useMemo(() => allPoints.map(p => createLinePath(p)), [allPoints, createLinePath]);
    const areaPaths = useMemo(() => allPoints.map(p => createAreaPath(p)), [allPoints, createAreaPath]);

    const handlePointPress = (index: number) => {
        setSelectedIndex(selectedIndex === index ? null : index);
    };

    const primaryData = dataSets[0]?.data ?? [];
    if (primaryData.length === 0) {
        return (
            <View style={{ height: height + 30 + legendHeight, width: chartWidth, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: c.loadingText, fontSize: 13 }}>차트 로딩중...</Text>
            </View>
        );
    }

    const primaryPoints = allPoints[0] ?? [];

    return (
        <View style={[styles.container, { width: chartWidth, height: height + 30 + legendHeight }]}>
            <Svg width={chartWidth} height={height}>
                <Defs>
                    {dataSets.map((ds, idx) => (
                        <LinearGradient key={`gradient-${idx}`} id={`multiGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={ds.color} stopOpacity="0.4" />
                            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" />
                        </LinearGradient>
                    ))}
                </Defs>

                {/* X축 라인 */}
                <Line
                    x1={chartPadding.left}
                    y1={chartPadding.top + innerHeight}
                    x2={chartWidth - chartPadding.right}
                    y2={chartPadding.top + innerHeight}
                    stroke={c.axis}
                    strokeWidth={1}
                />

                {/* 세로 점선 그리드 */}
                {primaryPoints.map((point, index) => (
                    <Line
                        key={`y-strip-${index}`}
                        x1={point.x}
                        y1={chartPadding.top}
                        x2={point.x}
                        y2={chartPadding.top + innerHeight}
                        stroke={c.grid}
                        strokeWidth={1}
                        strokeDasharray="3,3"
                    />
                ))}

                {/* 영역 채우기 (뒤에서부터) */}
                {[...areaPaths].reverse().map((aPath, idx) => {
                    const realIdx = dataSets.length - 1 - idx;
                    return aPath ? <Path key={`area-${realIdx}`} d={aPath} fill={`url(#multiGradient${realIdx})`} /> : null;
                })}

                {/* 라인 (뒤에서부터) */}
                {[...linePaths].reverse().map((lPath, idx) => {
                    const realIdx = dataSets.length - 1 - idx;
                    return lPath ? <Path key={`line-${realIdx}`} d={lPath} stroke={dataSets[realIdx].color} strokeWidth={2} fill="none" /> : null;
                })}

                {/* 데이터 포인트 (뒤에서부터) */}
                {[...allPoints].reverse().map((pts, idx) => {
                    const realIdx = dataSets.length - 1 - idx;
                    return pts.map((point, pIdx) => (
                        <Circle
                            key={`point-${realIdx}-${pIdx}`}
                            cx={point.x}
                            cy={point.y}
                            r={selectedIndex === pIdx ? 5 : 3}
                            fill={dataSets[realIdx].color}
                        />
                    ));
                })}
            </Svg>

            {/* 터치 영역 및 툴팁 */}
            {primaryPoints.map((primaryPoint, index) => {
                const isFirstData = index === 0;
                const isLastData = index === primaryPoints.length - 1;

                const allYValues = allPoints.map(pts => pts[index]?.y ?? primaryPoint.y);
                const topY = Math.min(...allYValues);
                const bottomY = Math.max(...allYValues);

                const touchAreaTop = topY - 25;
                const touchAreaHeight = Math.max(bottomY - topY + 50, 60);

                let tooltipLeft = -20;
                if (isFirstData) {
                    tooltipLeft = 30;
                } else if (isLastData) {
                    tooltipLeft = -70;
                }

                const isHighValue = allPoints.some(pts => (pts[index]?.originalValue ?? 0) >= maxValue * 0.53);
                const minTooltipTop = -touchAreaTop;
                let tooltipTop = -40;
                if (isHighValue) {
                    tooltipTop = -60;
                }
                tooltipTop = Math.max(tooltipTop, minTooltipTop);

                return (
                    <TouchableOpacity
                        key={`touch-${index}`}
                        style={[
                            styles.touchArea,
                            {
                                left: primaryPoint.x - 25,
                                top: touchAreaTop,
                                width: 50,
                                height: touchAreaHeight,
                            }
                        ]}
                        onPress={() => handlePointPress(index)}
                        activeOpacity={0.7}
                    >
                        {selectedIndex === index && (
                            <View style={[
                                styles.tooltip,
                                {
                                    top: tooltipTop,
                                    left: tooltipLeft,
                                    backgroundColor: c.tooltipBg,
                                    borderColor: c.tooltipBorder,
                                }
                            ]}>
                                {dataSets.map((ds, dsIdx) => (
                                    <Text key={dsIdx} style={[styles.tooltipText, { color: c.tooltipText }]}>
                                        {ds.label}: <Text style={{ color: ds.color }}>{allPoints[dsIdx]?.[index]?.originalValue ?? 0}{unit}</Text>
                                    </Text>
                                ))}
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}

            {/* X축 라벨 */}
            {primaryPoints.map((point, index) => {
                const isFirst = index === 0;
                const isLast = index === primaryPoints.length - 1;
                const translateX = isFirst ? -5 : isLast ? -15 : -10;

                return (
                    <Text
                        key={`label-${index}`}
                        style={{
                            position: 'absolute',
                            left: point.x,
                            top: height + 5,
                            transform: [{ translateX }],
                            fontSize: 11,
                            color: c.labelText,
                        }}
                    >
                        {point.label}
                    </Text>
                );
            })}

            {/* 범례 */}
            <View style={[styles.legendContainer, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
                {dataSets.map((ds, idx) => (
                    <View key={idx} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: ds.color }]} />
                        <Text style={[styles.legendText, { color: c.legendText }]}>{ds.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginTop: 10,
    },
    touchArea: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltip: {
        position: 'absolute',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        borderWidth: 1,
        minWidth: 85,
        maxWidth: 100,
    },
    tooltipText: {
        fontSize: 10,
        fontWeight: '500',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 15,
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    legendText: {
        fontSize: 11,
    },
});

export const SVGMultiLineChart = React.memo(
    SVGMultiLineChartComponent,
    (prevProps, nextProps) => {
        return JSON.stringify(prevProps.dataSets) === JSON.stringify(nextProps.dataSets)
            && prevProps.width === nextProps.width
            && prevProps.height === nextProps.height;
    }
);
